from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import time

scheduler = BackgroundScheduler()

# --- NEW: Mock Email Service ---
def send_email_alert(job_name, findings_count):
    """
    Simulates sending an email alert via SMTP/SendGrid.
    """
    print("\n" + "="*50)
    print(f"📧 EMAIL ALERT SENT TO: admin@company.com")
    print(f"Subject: [ALERT] High PII Risk Detected in {job_name}")
    print(f"Body: Scan completed. Found {findings_count} critical issues. Immediate action required.")
    print("="*50 + "\n")

# --- Updated Task Logic ---
def test_job_task(job_id):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔄 Executing Scheduled Scan: {job_id}...")
    
    # Simulate processing time
    time.sleep(2)
    
    # Simulate finding risks (Randomly trigger alert)
    findings = 5  # Let's pretend we found 5 issues
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Scan Complete. Risks Found: {findings}")
    
    # Trigger Email Alert
    send_email_alert(job_id, findings)

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("? Scheduler Service Started.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("🛑 Scheduler Service Stopped.")

def add_test_job(job_id: str, seconds: int = 10):
    # Add job that repeats every X seconds
    try:
        scheduler.add_job(
            test_job_task, 
            "interval", 
            seconds=seconds, 
            id=job_id, 
            args=[job_id], 
            replace_existing=True
        )
        return job_id
    except Exception as e:
        print(f"Error scheduling job: {e}")
        return None
