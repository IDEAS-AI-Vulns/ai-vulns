import ast
import re
import time
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any, Set, Tuple
import tree_sitter
from tree_sitter import Language, Parser

from .chunk import CodeChunk, ChunkType
from .token_utils import count_tokens, estimate_complexity

# Set up detailed logging for AST chunking
logger = logging.getLogger(__name__)


class ASTChunker:
    """Advanced AST-based code chunker supporting multiple languages with detailed logging."""

    def __init__(self):
        self.parsers: Dict[str, Parser] = {}
        self.languages: Dict[str, Language] = {}
        self._init_parsers()

    def _init_parsers(self):
        """Initialize tree-sitter parsers for supported languages."""
        logger.info("INITIALIZING AST PARSERS")
        logger.info("=" * 40)

        try:
            from tree_sitter_language_pack import get_language

            logger.info(
                "Using tree-sitter-language-pack for comprehensive language support"
            )

            # Languages available in the language pack
            languages = {
                "python": "python",
                "javascript": "javascript",
                "typescript": "typescript",
                "java": "java",
                "go": "go",
                "c": "c",
                "cpp": "cpp",
                "c_sharp": "c_sharp",
                "rust": "rust",
                "kotlin": "kotlin",
                "ruby": "ruby",
                "php": "php",
            }

            successful_parsers = []
            failed_parsers = []

            for lang_name, lang_key in languages.items():
                try:
                    logger.info(f"Loading parser for {lang_name}...")
                    language = get_language(lang_key)
                    parser = Parser()
                    parser.language = language

                    self.languages[lang_name] = language
                    self.parsers[lang_name] = parser
                    successful_parsers.append(lang_name)
                    logger.info(f"  {lang_name} parser loaded successfully")

                except Exception as e:
                    error_msg = f"{lang_name} (Error: {e})"
                    failed_parsers.append(error_msg)
                    logger.warning(f"  Failed to load {lang_name} parser: {e}")
                    continue

            logger.info("Parser initialization summary:")
            logger.info(f"  Successful: {len(successful_parsers)} parsers")
            if successful_parsers:
                logger.info(f"     Languages: {', '.join(successful_parsers)}")
            logger.info(f"  Failed: {len(failed_parsers)} parsers")
            if failed_parsers:
                for failed in failed_parsers:
                    logger.info(f"     {failed}")

            # Ensure we have at least basic parsers working
            if len(successful_parsers) == 0:
                logger.error("Critical: No language parsers loaded successfully")
                logger.error("Please check tree-sitter-language-pack installation")
            else:
                logger.info(
                    f"Language pack loaded successfully with {len(successful_parsers)} languages"
                )

        except ImportError as e:
            logger.error("tree-sitter-language-pack not found!")
            logger.error("Install with: pip install tree-sitter-language-pack")
            logger.error(f"Import error: {e}")
            logger.warning("System will continue with limited AST parsing capabilities")
        except Exception as e:
            logger.error(f"Critical error during parser initialization: {e}")
            logger.exception("Full error details:")
            logger.warning("System will continue with limited AST parsing capabilities")

    def supports_language(self, language: str) -> bool:
        """Check if a language is supported."""
        supported = language in self.parsers
        logger.debug(
            f"Language support check: {language} -> {'supported' if supported else 'not supported'}"
        )
        return supported

    def chunk_file(self, file_path: Path, language: str) -> List[CodeChunk]:
        """Main chunking method that orchestrates different strategies with detailed logging."""
        from ..core.config import settings
        
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info(f"AST CHUNKING: {file_path.name} ({language})")
            logger.info("-" * 50)

        if not self.supports_language(language):
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.error(f"Language {language} not supported")
            return []

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            content_size = len(content)
            content_lines = content.count("\n")
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info(f"File loaded: {content_size:,} chars, {content_lines:,} lines")

        except Exception as e:
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.error(f"Failed to read file: {e}")
            return []

        if not content.strip():
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.warning("File is empty or contains only whitespace")
            return []

        # STEP 1: Parse with tree-sitter
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info("STEP 1: AST PARSING")
            logger.info("-" * 20)

        parse_start = time.time()
        try:
            parser = self.parsers[language]
            tree = parser.parse(bytes(content, "utf8"))
            parse_time = time.time() - parse_start

            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info(f"AST parsing completed in {parse_time:.3f} seconds")
                logger.info(f"Root node type: {tree.root_node.type}")
                logger.info(f"Root node children: {len(tree.root_node.children)}")

        except Exception as e:
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.error(f"AST parsing failed: {e}")
            return []

        lines = content.split("\n")
        chunks = []

        # STEP 2: Create whole file chunk
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info("\nSTEP 2: FILE-LEVEL CHUNK")
            logger.info("-" * 20)

        file_chunk = self._create_file_chunk(file_path, content, language)
        chunks.append(file_chunk)
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info(f"File chunk created: {file_chunk.tokens_count} tokens")

        # STEP 3: Extract functions and classes with AST
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info("\nSTEP 3: AST STRUCTURE EXTRACTION")
            logger.info("-" * 20)

        extraction_start = time.time()
        ast_chunks = self._extract_ast_chunks(tree, file_path, content, lines, language)
        extraction_time = time.time() - extraction_start

        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info(f"AST extraction completed in {extraction_time:.3f} seconds")
            logger.info(f"Extracted {len(ast_chunks)} structural chunks")

        # Log chunk types
        chunk_types = {}
        for chunk in ast_chunks:
            chunk_type = chunk.chunk_type.value
            chunk_types[chunk_type] = chunk_types.get(chunk_type, 0) + 1

        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info(f"Extracted chunk types: {chunk_types}")

            # Show details for each type
            for chunk_type, count in chunk_types.items():
                type_chunks = [c for c in ast_chunks if c.chunk_type.value == chunk_type]
                logger.info(f"  {chunk_type} ({count}):")
                for i, chunk in enumerate(type_chunks[:3], 1):  # Show first 3
                    logger.info(f"    [{i}] {chunk.symbol_name}")
                    logger.info(f"        Lines: {chunk.start_line}-{chunk.end_line}")
                    logger.info(f"        Tokens: {chunk.tokens_count}, Complexity: {chunk.complexity:.1f}")
                    if hasattr(chunk, 'parent_symbol') and chunk.parent_symbol:
                        logger.info(f"        Parent: {chunk.parent_symbol}")
                if len(type_chunks) > 3:
                    logger.info(f"    ... and {len(type_chunks) - 3} more {chunk_type} chunks")

        chunks.extend(ast_chunks)

        # STEP 4: Large chunk subdivision (OPTIONAL - can be disabled for speed)
        if settings.ENABLE_CHUNK_SUBDIVISION:
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info("\nSTEP 4: LARGE CHUNK SUBDIVISION")
                logger.info("-" * 20)

            large_chunks = [c for c in ast_chunks if c.tokens_count > 300]
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info(f"Found {len(large_chunks)} chunks > 300 tokens requiring subdivision")

            subdivision_chunks = []
            for large_chunk in large_chunks:
                if not settings.REDUCE_CHUNKING_LOGS:
                    logger.info(f"  Subdividing: {large_chunk.symbol_name} ({large_chunk.tokens_count} tokens)")
                
                sub_chunks = self._create_overlapping_subchunks(large_chunk, file_path, language)
                subdivision_chunks.extend(sub_chunks)
                
                if not settings.REDUCE_CHUNKING_LOGS:
                    logger.info(f"    Created {len(sub_chunks)} sub-chunks")

            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info(f"Total overlapped sub-chunks created: {len(subdivision_chunks)}")
            chunks.extend(subdivision_chunks)
        else:
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info("\nSTEP 4: LARGE CHUNK SUBDIVISION")
                logger.info("-" * 20)
                logger.info("Subdivision disabled for performance - skipping")

        # STEP 5: Function grouping (OPTIONAL)
        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info("\nSTEP 5: FUNCTION GROUPING")
            logger.info("-" * 20)

        grouping_start = time.time()
        grouped_chunks = self._create_grouped_chunks(ast_chunks, file_path, content, language)
        grouping_time = time.time() - grouping_start

        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info(f"Function grouping completed in {grouping_time:.3f} seconds")
            logger.info(f"Created {len(grouped_chunks)} grouped chunks")

        chunks.extend(grouped_chunks)

        # Apply MAX_CHUNKS_PER_FILE limit
        if settings.MAX_CHUNKS_PER_FILE > 0 and len(chunks) > settings.MAX_CHUNKS_PER_FILE:
            # Keep file chunk + top priority structural chunks
            file_chunks = [c for c in chunks if c.chunk_type.value == "file"]
            other_chunks = [c for c in chunks if c.chunk_type.value != "file"]
            
            # Sort by priority and tokens (prefer larger, more complex chunks)
            other_chunks.sort(key=lambda c: (c.priority_score, c.tokens_count), reverse=True)
            
            # Keep top chunks within limit
            max_other = settings.MAX_CHUNKS_PER_FILE - len(file_chunks)
            chunks = file_chunks + other_chunks[:max_other]
            
            if not settings.REDUCE_CHUNKING_LOGS:
                logger.info(f"Limited to {len(chunks)} chunks per file (from {len(file_chunks) + len(other_chunks)})")

        # Final statistics
        total_chunks = len(chunks)
        final_chunk_types = {}
        for chunk in chunks:
            chunk_type = chunk.chunk_type.value
            final_chunk_types[chunk_type] = final_chunk_types.get(chunk_type, 0) + 1

        total_tokens = sum(chunk.tokens_count for chunk in chunks)
        avg_tokens = total_tokens / total_chunks if total_chunks > 0 else 0

        if not settings.REDUCE_CHUNKING_LOGS:
            logger.info("\nAST CHUNKING SUMMARY")
            logger.info("-" * 20)
            logger.info(f"Total chunks created: {total_chunks}")
            logger.info(f"Final chunk distribution: {final_chunk_types}")
            logger.info(f"Total tokens: {total_tokens:,}")
            logger.info(f"Average tokens per chunk: {avg_tokens:.1f}")

        return chunks

    def _create_file_chunk(
        self, file_path: Path, content: str, language: str
    ) -> CodeChunk:
        """Create a chunk representing the entire file."""
        lines = content.split("\n")
        imports = self._extract_imports(content, language)

        logger.debug(f"Creating file chunk: {len(lines)} lines, {len(imports)} imports")

        return CodeChunk(
            file_path=file_path,
            content=content,
            start_line=1,
            end_line=len(lines),
            language=language,
            symbol_name=file_path.stem,
            chunk_type=ChunkType.FILE,
            tokens_count=count_tokens(content),
            chars_count=len(content),
            complexity_score=estimate_complexity(content),
            imports=imports,
        )

    def _extract_ast_chunks(
        self, tree, file_path: Path, content: str, lines: List[str], language: str
    ) -> List[CodeChunk]:
        """Extract functions and classes using AST with detailed logging."""
        logger.debug("Starting AST node traversal...")

        chunks = []

        # Language-specific node types
        function_types = self._get_function_node_types(language)
        class_types = self._get_class_node_types(language)

        logger.debug("Target node types:")
        logger.debug(f"  Functions: {function_types}")
        logger.debug(f"  Classes: {class_types}")

        # Statistics for traversal
        traversal_stats = {
            "nodes_visited": 0,
            "function_nodes_found": 0,
            "class_nodes_found": 0,
            "chunks_created": 0,
            "chunks_failed": 0,
        }

        # Traverse the tree and extract symbols
        def traverse(node, parent_class=None, depth=0):
            traversal_stats["nodes_visited"] += 1

            # Log first few levels of traversal for debugging
            if depth <= 2:
                logger.debug(
                    f"{'  ' * depth}Node: {node.type} (line {node.start_point[0] + 1})"
                )

            if node.type in function_types:
                traversal_stats["function_nodes_found"] += 1
                logger.debug(
                    f"Found function node: {node.type} at line {node.start_point[0] + 1}"
                )

                chunk = self._create_function_chunk(
                    node, file_path, content, lines, language, parent_class
                )
                if chunk:
                    chunks.append(chunk)
                    traversal_stats["chunks_created"] += 1
                    logger.debug(f"  Function chunk created: {chunk.symbol_name}")
                else:
                    traversal_stats["chunks_failed"] += 1
                    logger.debug("  Function chunk creation failed")

            elif node.type in class_types:
                traversal_stats["class_nodes_found"] += 1
                logger.debug(
                    f"Found class node: {node.type} at line {node.start_point[0] + 1}"
                )

                class_chunk = self._create_class_chunk(
                    node, file_path, content, lines, language
                )
                if class_chunk:
                    chunks.append(class_chunk)
                    traversal_stats["chunks_created"] += 1
                    logger.debug(f"  Class chunk created: {class_chunk.symbol_name}")
                else:
                    traversal_stats["chunks_failed"] += 1
                    logger.debug("  Class chunk creation failed")

                # Process methods within the class
                class_name = self._get_node_name(node, content) or "anonymous_class"
                logger.debug(f"  Processing methods in class: {class_name}")

                for child in node.children:
                    traverse(child, class_name, depth + 1)

            else:
                for child in node.children:
                    traverse(child, parent_class, depth + 1)

        # Start traversal
        traverse_start = time.time()
        traverse(tree.root_node)
        traverse_time = time.time() - traverse_start

        logger.debug(f"AST traversal completed in {traverse_time:.3f} seconds")
        logger.debug("Traversal statistics:")
        logger.debug(f"  Nodes visited: {traversal_stats['nodes_visited']}")
        logger.debug(
            f"  Function nodes found: {traversal_stats['function_nodes_found']}"
        )
        logger.debug(f"  Class nodes found: {traversal_stats['class_nodes_found']}")
        logger.debug(f"  Chunks created: {traversal_stats['chunks_created']}")
        logger.debug(f"  Chunks failed: {traversal_stats['chunks_failed']}")

        return chunks

    def _create_function_chunk(
        self,
        node,
        file_path: Path,
        content: str,
        lines: List[str],
        language: str,
        parent_class: Optional[str] = None,
    ) -> Optional[CodeChunk]:
        """Create a chunk for a function/method."""
        start_line = node.start_point[0] + 1
        end_line = node.end_point[0] + 1

        function_content = "\n".join(lines[start_line - 1 : end_line])
        if not function_content.strip():
            logger.debug(f"Function content is empty (lines {start_line}-{end_line})")
            return None

        function_name = (
            self._get_node_name(node, content) or f"function_at_line_{start_line}"
        )

        # Add context (overlap)
        context_before, context_after = self._get_context(
            lines, start_line - 1, end_line - 1, overlap=3
        )

        chunk_type = ChunkType.METHOD if parent_class else ChunkType.FUNCTION

        token_count = count_tokens(function_content)
        complexity = estimate_complexity(function_content)
        deps = self._extract_dependencies(function_content, language)

        logger.debug(f"Function chunk: {function_name}")
        logger.debug(f"  Type: {chunk_type.value}, Parent: {parent_class or 'None'}")
        logger.debug(
            f"  Lines: {start_line}-{end_line}, Tokens: {token_count}, Complexity: {complexity:.1f}"
        )
        logger.debug(f"  Dependencies: {len(deps)}")

        return CodeChunk(
            file_path=file_path,
            content=function_content,
            start_line=start_line,
            end_line=end_line,
            language=language,
            symbol_name=function_name,
            chunk_type=chunk_type,
            parent_symbol=parent_class,
            tokens_count=token_count,
            chars_count=len(function_content),
            context_before=context_before,
            context_after=context_after,
            complexity_score=complexity,
            dependencies=deps,
        )

    def _create_class_chunk(
        self, node, file_path: Path, content: str, lines: List[str], language: str
    ) -> Optional[CodeChunk]:
        """Create a chunk for a class."""
        start_line = node.start_point[0] + 1
        end_line = node.end_point[0] + 1

        class_content = "\n".join(lines[start_line - 1 : end_line])
        if not class_content.strip():
            logger.debug(f"Class content is empty (lines {start_line}-{end_line})")
            return None

        class_name = self._get_node_name(node, content) or f"class_at_line_{start_line}"

        # Add context (overlap)
        context_before, context_after = self._get_context(
            lines, start_line - 1, end_line - 1, overlap=3
        )

        token_count = count_tokens(class_content)
        complexity = estimate_complexity(class_content)
        deps = self._extract_dependencies(class_content, language)

        logger.debug(f"Class chunk: {class_name}")
        logger.debug(
            f"  Lines: {start_line}-{end_line}, Tokens: {token_count}, Complexity: {complexity:.1f}"
        )
        logger.debug(f"  Dependencies: {len(deps)}")

        return CodeChunk(
            file_path=file_path,
            content=class_content,
            start_line=start_line,
            end_line=end_line,
            language=language,
            symbol_name=class_name,
            chunk_type=ChunkType.CLASS,
            tokens_count=token_count,
            chars_count=len(class_content),
            context_before=context_before,
            context_after=context_after,
            complexity_score=complexity,
            dependencies=deps,
        )

    def _create_overlapping_subchunks(
        self, large_chunk: CodeChunk, file_path: Path, language: str
    ) -> List[CodeChunk]:
        """Split large functions/classes into smaller overlapping chunks."""
        if large_chunk.tokens_count <= 300:
            return []

        logger.debug(
            f"Subdividing large chunk: {large_chunk.symbol_name} ({large_chunk.tokens_count} tokens)"
        )

        lines = large_chunk.content.split("\n")
        chunks = []

        # Target ~250 tokens per chunk with 20% overlap
        target_lines = min(25, len(lines) // 3)  # Rough estimate
        overlap_lines = max(3, target_lines // 5)

        logger.debug(
            f"  Parameters: target_lines={target_lines}, overlap_lines={overlap_lines}"
        )

        start_idx = 0
        chunk_num = 1

        while start_idx < len(lines):
            end_idx = min(start_idx + target_lines, len(lines))
            subchunk_content = "\n".join(lines[start_idx:end_idx])

            if subchunk_content.strip():
                token_count = count_tokens(subchunk_content)

                chunks.append(
                    CodeChunk(
                        file_path=file_path,
                        content=subchunk_content,
                        start_line=large_chunk.start_line + start_idx,
                        end_line=large_chunk.start_line + end_idx - 1,
                        language=language,
                        symbol_name=f"{large_chunk.symbol_name}_part_{chunk_num}",
                        chunk_type=large_chunk.chunk_type,
                        parent_symbol=large_chunk.parent_symbol,
                        tokens_count=token_count,
                        chars_count=len(subchunk_content),
                    )
                )

                logger.debug(
                    f"    Part {chunk_num}: lines {start_idx}-{end_idx}, {token_count} tokens"
                )

            start_idx += target_lines - overlap_lines
            chunk_num += 1

        logger.debug(f"  Created {len(chunks)} sub-chunks")
        return chunks

    def _create_grouped_chunks(
        self, ast_chunks: List[CodeChunk], file_path: Path, content: str, language: str
    ) -> List[CodeChunk]:
        """Create chunks by grouping related functions/classes."""
        logger.debug("Creating grouped chunks...")

        chunks = []

        # Group by class
        class_groups: Dict[str, List[CodeChunk]] = {}
        for chunk in ast_chunks:
            if chunk.chunk_type == ChunkType.METHOD and chunk.parent_symbol:
                if chunk.parent_symbol not in class_groups:
                    class_groups[chunk.parent_symbol] = []
                class_groups[chunk.parent_symbol].append(chunk)

        logger.debug(f"Found {len(class_groups)} classes with methods to group")

        # Create grouped chunks for each class
        for class_name, methods in class_groups.items():
            if len(methods) > 1:
                combined_content = "\n\n".join([chunk.content for chunk in methods])
                total_tokens = sum(chunk.tokens_count for chunk in methods)

                logger.debug(
                    f"  Class {class_name}: {len(methods)} methods, {total_tokens} tokens"
                )

                # Only create if within reasonable size
                if total_tokens <= 400:
                    min_line = min(chunk.start_line for chunk in methods)
                    max_line = max(chunk.end_line for chunk in methods)

                    chunks.append(
                        CodeChunk(
                            file_path=file_path,
                            content=combined_content,
                            start_line=min_line,
                            end_line=max_line,
                            language=language,
                            symbol_name=f"{class_name}_methods_group",
                            chunk_type=ChunkType.CLASS,
                            parent_symbol=class_name,
                            tokens_count=total_tokens,
                            chars_count=len(combined_content),
                        )
                    )

                    logger.debug("    Created method group chunk")
                else:
                    logger.debug(
                        f"    Group too large ({total_tokens} tokens), skipping"
                    )

        logger.debug(f"Created {len(chunks)} grouped chunks")
        return chunks

    def _get_context(
        self, lines: List[str], start_idx: int, end_idx: int, overlap: int = 3
    ) -> Tuple[Optional[str], Optional[str]]:
        """Get context lines before and after a code block."""
        context_before = None
        context_after = None

        if start_idx > 0:
            context_start = max(0, start_idx - overlap)
            context_before = "\n".join(lines[context_start:start_idx])

        if end_idx < len(lines) - 1:
            context_end = min(len(lines), end_idx + 1 + overlap)
            context_after = "\n".join(lines[end_idx + 1 : context_end])

        return context_before if context_before and context_before.strip() else None, (
            context_after if context_after and context_after.strip() else None
        )

    def _get_function_node_types(self, language: str) -> Set[str]:
        """Get AST node types that represent functions for a given language."""
        type_mappings = {
            "python": {"function_definition", "async_function_definition"},
            "javascript": {
                "function_declaration",
                "method_definition",
                "arrow_function",
            },
            "typescript": {
                "function_declaration",
                "method_definition",
                "arrow_function",
            },
            "java": {"method_declaration", "constructor_declaration"},
            "go": {"function_declaration", "method_declaration"},
            "c": {"function_definition"},
            "cpp": {"function_definition", "function_declarator"},
            "c_sharp": {"method_declaration", "constructor_declaration"},
            "rust": {"function_item", "function_signature_item"},
            "kotlin": {"function_declaration"},
            "ruby": {"method", "singleton_method"},
            "php": {"function_definition", "method_declaration"},
            "scala": {"function_definition"},
            "swift": {"function_declaration"},
            "dart": {"function_signature", "method_signature"},
        }
        return type_mappings.get(language, set())

    def _get_class_node_types(self, language: str) -> Set[str]:
        """Get AST node types that represent classes for a given language."""
        type_mappings = {
            "python": {"class_definition"},
            "javascript": {"class_declaration"},
            "typescript": {"class_declaration", "interface_declaration"},
            "java": {"class_declaration", "interface_declaration"},
            "go": {"type_declaration"},
            "c": {"struct_specifier", "union_specifier"},
            "cpp": {"class_specifier", "struct_specifier"},
            "c_sharp": {
                "class_declaration",
                "interface_declaration",
                "struct_declaration",
            },
            "rust": {"struct_item", "enum_item", "trait_item"},
            "kotlin": {"class_declaration", "interface_declaration"},
            "ruby": {"class", "module"},
            "php": {"class_declaration", "interface_declaration"},
            "scala": {"class_definition", "trait_definition", "object_definition"},
            "swift": {
                "class_declaration",
                "struct_declaration",
                "protocol_declaration",
            },
            "dart": {"class_definition", "extension_declaration"},
        }
        return type_mappings.get(language, set())

    def _get_node_name(self, node, content: str) -> Optional[str]:
        """Extract the name of a function or class from AST node."""
        for child in node.children:
            if child.type == "identifier":
                start_byte = child.start_byte
                end_byte = child.end_byte
                name = content[start_byte:end_byte]
                logger.debug(f"Extracted name: '{name}'")
                return name
        logger.debug(f"No name found for node type: {node.type}")
        return None

    def _extract_imports(self, content: str, language: str) -> List[str]:
        """Extract import statements from code."""
        imports = []

        if language == "python":
            pattern = r"^(?:from\s+\S+\s+)?import\s+.+$"
        elif language in ["javascript", "typescript"]:
            pattern = r"^import\s+.+$"
        elif language == "java":
            pattern = r"^import\s+.+;$"
        elif language == "go":
            pattern = r"^import\s+.+$"
        else:
            return imports

        for line in content.split("\n"):
            line = line.strip()
            if re.match(pattern, line):
                imports.append(line)

        logger.debug(f"Extracted {len(imports)} import statements")
        return imports

    def _extract_dependencies(self, content: str, language: str) -> List[str]:
        """Extract function/class dependencies from code."""
        # Simple regex-based extraction - could be enhanced with AST
        dependencies = []

        # Common patterns for function calls
        if language == "python":
            pattern = r"\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
        elif language in ["javascript", "typescript", "java", "c", "cpp"]:
            pattern = r"\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
        else:
            return dependencies

        matches = re.findall(pattern, content)
        # Filter out common keywords and built-ins
        excluded = {
            "if",
            "for",
            "while",
            "try",
            "catch",
            "return",
            "print",
            "len",
            "range",
            "str",
            "int",
            "float",
        }
        dependencies = [match for match in set(matches) if match not in excluded]

        logger.debug(f"Extracted {len(dependencies)} dependencies")
        return dependencies[:10]  # Limit to avoid too much metadata
