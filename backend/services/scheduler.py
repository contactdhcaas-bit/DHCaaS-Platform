from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime

# Initialize the scheduler
scheduler = AsyncIOScheduler()

def start_scheduler():
    """Starts the scheduler if not already running."""
    if not scheduler.running:
        scheduler.start()
        print("? Scheduler Service Started.")

def shutdown_scheduler():
    """Shuts down the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        print("?? Scheduler Service Stopped.")

async def sample_scheduled_task(task_name: str):
    """A sample async task to demonstrate scheduling."""
    print(f"?? [Scheduled Job Executed] Task: {task_name} at {datetime.now()}")

def add_test_job(task_name: str, seconds: int = 10):
    """Adds a job that runs every X seconds."""
    job = scheduler.add_job(
        sample_scheduled_task, 
        "interval", 
        seconds=seconds, 
        args=[task_name],
        id=f"job_{task_name}",
        replace_existing=True
    )
    return job.id

