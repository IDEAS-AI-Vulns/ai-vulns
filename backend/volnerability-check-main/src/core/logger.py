import contextvars
import logging

job_id_context = contextvars.ContextVar("job_id", default="SYSTEM")

class JobIdFilter(logging.Filter):
    def filter(self, record):
        record.job_id = job_id_context.get()
        return True