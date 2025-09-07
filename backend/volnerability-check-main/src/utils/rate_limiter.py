import time
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class OpenAIRateLimiter:
    """Rate limiter for OpenAI API calls to prevent quota exhaustion."""
    
    def __init__(self, 
                 calls_per_minute: int = 1000,  # Conservative limit
                 delay_between_calls: float = 1,  # 1.5 seconds between calls
                 burst_limit: int = 3):  # Max 3 calls in quick succession
        self.calls_per_minute = calls_per_minute
        self.delay_between_calls = delay_between_calls  
        self.burst_limit = burst_limit
        
        self.call_times = []
        self.last_call_time = 0
        self.burst_count = 0
        
    async def wait_if_needed(self):
        """Wait if we need to respect rate limits."""
        current_time = time.time()
        
        # Clean old call times (older than 1 minute)
        minute_ago = current_time - 60
        self.call_times = [t for t in self.call_times if t > minute_ago]
        
        # Check if we're at the per-minute limit
        if len(self.call_times) >= self.calls_per_minute:
            wait_time = 60 - (current_time - self.call_times[0]) + 1
            if wait_time > 0:
                logger.warning(f"Rate limit reached. Waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)
                return await self.wait_if_needed()  # Recheck
        
        # Check burst limiting
        if current_time - self.last_call_time < self.delay_between_calls:
            self.burst_count += 1
            if self.burst_count >= self.burst_limit:
                wait_time = self.delay_between_calls
                logger.debug(f"Burst limit reached. Waiting {wait_time}s")
                await asyncio.sleep(wait_time)
                self.burst_count = 0
        else:
            self.burst_count = 0
            
        # Minimum delay between calls
        time_since_last = current_time - self.last_call_time
        if time_since_last < self.delay_between_calls:
            wait_time = self.delay_between_calls - time_since_last
            logger.debug(f"Enforcing minimum delay: {wait_time:.1f}s")
            await asyncio.sleep(wait_time)
        
        # Record this call
        self.call_times.append(time.time())
        self.last_call_time = time.time()
        
        logger.debug(f"Rate limiter: {len(self.call_times)}/{self.calls_per_minute} calls in last minute")

# Global rate limiter instance
rate_limiter = OpenAIRateLimiter(
    calls_per_minute=45,  # Conservative limit
    delay_between_calls=2.0,  # 2 seconds between calls  
    burst_limit=2  # Max 2 quick calls
)
