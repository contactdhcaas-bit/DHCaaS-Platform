# backend/services/zoho_service.py
import os
import httpx
from datetime import datetime
from typing import Optional, Dict, Any


class ZohoService:
    """Service for creating Zoho Desk tickets"""
    
    def __init__(self):
        self.org_id = os.getenv("ZOHO_ORG_ID")
        self.access_token = os.getenv("ZOHO_ACCESS_TOKEN")
        self.api_base = "https://desk.zoho.com/api/v1"
        
        if not self.org_id or not self.access_token:
            print("WARNING: Zoho credentials not configured in .env")
    
    async def create_ticket(
        self,
        subject: str,
        description: str,
        priority: str = "Medium",
        category: str = "General",
        department_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a ticket in Zoho Desk
        
        Args:
            subject: Ticket subject
            description: Ticket description
            priority: High, Medium, Low
            category: Ticket category
            department_id: Optional department ID
        
        Returns:
            Ticket data or None if failed
        """
        
        if not self.org_id or not self.access_token:
            print("ERROR: Cannot create Zoho ticket - credentials missing")
            return None
        
        try:
            url = f"{self.api_base}/tickets"
            
            headers = {
                "Authorization": f"Zoho-oauthtoken {self.access_token}",
                "orgId": self.org_id,
                "Content-Type": "application/json"
            }
            
            payload = {
                "subject": subject,
                "description": description,
                "priority": priority,
                "category": category,
                "status": "Open",
                "channel": "API"
            }
            
            if department_id:
                payload["departmentId"] = department_id
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                
                if response.status_code == 200:
                    ticket_data = response.json()
                    print(f"✅ Zoho ticket created: {ticket_data.get('ticketNumber', 'N/A')}")
                    return ticket_data
                else:
                    print(f"❌ Zoho API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"❌ Exception creating Zoho ticket: {str(e)}")
            return None
