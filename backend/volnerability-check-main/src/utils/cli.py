#!/usr/bin/env python3

import argparse
import logging
import sys
from pathlib import Path
from typing import Callable

from ..utils.load_setting import load_setting
from ..analysis.pipeline import run_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("vulnerability_analysis.log", mode="w", encoding='utf-8'),
    ],
    force=True,
)

logger = logging.getLogger(__name__)
logger.info("Logging configuration initialized in cli.py")

from ..core.config import log_openai_configuration
log_openai_configuration()

def _add_common_arguments(parser: argparse.ArgumentParser):
    parser.add_argument("zip_path", type=str, help="Path to the ZIP file containing the repository")
    parser.add_argument("xlsx_path", type=str, help="Path to the XLSX file containing vulnerabilities")
    parser.add_argument("--rebuild-index", action="store_true", help="Rebuild the vector index from scratch")

def _execute_command(args: argparse.Namespace, runner_func: Callable, command_name: str):
    zip_path_obj = Path(args.zip_path)
    xlsx_path_obj = Path(args.xlsx_path)
    top_k = load_setting("default_top_k")

    logger.info(f"Starting {command_name} for {zip_path_obj}")
    logger.info(f"Configuration: top_k={top_k}, rebuild_index={args.rebuild_index}")

    if not zip_path_obj.exists():
        logger.error(f"ZIP file not found: {zip_path_obj}")
        sys.exit(1)

    if not xlsx_path_obj.exists():
        logger.error(f"XLSX file not found: {xlsx_path_obj}")
        sys.exit(1)

    try:
        runner_func(
            zip_path=zip_path_obj,
            xlsx_path=xlsx_path_obj,
            top_k=top_k,
            rebuild_index=args.rebuild_index,
        )
        logger.info(f"✅ {command_name} completed successfully!")
    except Exception as e:
        logger.error(f"❌ {command_name} failed: {str(e)}")
        logger.exception("Full error details:")
        sys.exit(1)

def main():
    logger.info("Starting application through main()")

    parser = argparse.ArgumentParser(
        description="Vulnerability Analysis & Evaluation Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m src analyze data/repo.zip data/vulns.xlsx
  python -m src evaluate-retrieval data/repo.zip data/test_cves.xlsx
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    analyze_parser = subparsers.add_parser("analyze", help="Run the production vulnerability analysis pipeline")
    _add_common_arguments(analyze_parser)

    eval_parser = subparsers.add_parser("evaluate-retrieval", help="[DEV TOOL] Run offline LLM-as-a-Judge to test retrieval accuracy")
    _add_common_arguments(eval_parser)

    args = parser.parse_args()

    if args.command == "analyze":
        _execute_command(args, run_pipeline, "Production Analysis Pipeline")
    elif args.command == "evaluate-retrieval":
        from ..testing.eval_retrieval import run_offline_evaluation
        _execute_command(args, run_offline_evaluation, "Offline Retrieval Evaluation")
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()