import requests
import sys
import time
import json
import subprocess
from datetime import datetime

class AIInterviewerAPITester:
    def __init__(self, base_url="https://code-screener.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.candidate_id = None
        self.interview_id = None
        self.session_token = None
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth header if we have a session token
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=timeout)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=timeout)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - {name}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout}s")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_test_user(self):
        """Create test user and session using MongoDB"""
        try:
            timestamp = int(time.time())
            self.user_id = f"test-user-{timestamp}"
            self.session_token = f"test_session_{timestamp}"
            
            # Create test user and session in MongoDB
            mongo_script = f"""
use('test_database');
db.users.insertOne({{
  user_id: '{self.user_id}',
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date().toISOString()
}});
db.user_sessions.insertOne({{
  user_id: '{self.user_id}',
  session_token: '{self.session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
}});
"""
            
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ Failed to create test user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error setting up test user: {str(e)}")
            return False

    def test_auth_me(self):
        """Test the /auth/me endpoint"""
        success, response = self.run_test(
            "Auth Me Endpoint",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            print(f"   User ID: {response.get('user_id', 'N/A')}")
            print(f"   Email: {response.get('email', 'N/A')}")
            print(f"   Name: {response.get('name', 'N/A')}")
        
        return success

    def test_resume_parse(self):
        """Test resume parsing endpoint"""
        # Create a test resume file
        test_resume_content = """
John Doe
Software Developer
Email: john.doe@example.com
Phone: +91 9876543210
Address: 123 Tech Street, Bangalore, India

Experience: 3 years in Android development
Skills: Kotlin, Java, Android SDK, Room, Retrofit, MVVM
LinkedIn: https://linkedin.com/in/johndoe
GitHub: https://github.com/johndoe
Portfolio: https://johndoe.dev

Education: B.Tech Computer Science
"""
        
        files = {'file': ('resume.txt', test_resume_content, 'text/plain')}
        
        success, response = self.run_test(
            "Resume Parse",
            "POST",
            "resume/parse",
            200,
            files=files,
            timeout=60
        )
        
        if success:
            print(f"   Parsed Name: {response.get('name', 'N/A')}")
            print(f"   Parsed Email: {response.get('email', 'N/A')}")
            print(f"   Parsed Role: {response.get('role', 'N/A')}")
            print(f"   Parsed Experience: {response.get('experience', 'N/A')}")
            print(f"   Parsed LinkedIn: {response.get('linkedin', 'N/A')}")
            print(f"   Parsed GitHub: {response.get('github', 'N/A')}")
        
        return success

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_create_candidate(self):
        """Test candidate creation with new fields"""
        if not self.user_id:
            print("❌ Cannot create candidate - no user ID")
            return False
            
        candidate_data = {
            "user_id": self.user_id,
            "name": "Test Candidate",
            "email": "test@example.com",
            "whatsapp": "+91 9876543210",
            "role": "Android Developer",
            "experience": "2 years",
            "tech_stack": "Kotlin, Java, Android SDK, Room, Retrofit",
            "address": "123 Tech Street, Bangalore, Karnataka, India",
            "linkedin": "https://linkedin.com/in/testcandidate",
            "github": "https://github.com/testcandidate",
            "twitter": "https://twitter.com/testcandidate",
            "portfolio": "https://testcandidate.dev",
            "kyc_aadhar": "1234 5678 9012",
            "kyc_pan": "ABCDE1234F"
        }
        
        success, response = self.run_test(
            "Create Candidate",
            "POST",
            "candidates",
            200,
            data=candidate_data
        )
        
        if success and 'id' in response:
            self.candidate_id = response['id']
            print(f"   Candidate ID: {self.candidate_id}")
            return True
        return False

    def test_start_interview(self):
        """Test starting an interview"""
        if not self.candidate_id:
            print("❌ Cannot start interview - no candidate ID")
            return False
            
        interview_data = {
            "candidate_id": self.candidate_id
        }
        
        success, response = self.run_test(
            "Start Interview",
            "POST",
            "interviews/start",
            200,
            data=interview_data,
            timeout=60  # AI response may take longer
        )
        
        if success and 'id' in response:
            self.interview_id = response['id']
            print(f"   Interview ID: {self.interview_id}")
            print(f"   Status: {response.get('status', 'N/A')}")
            print(f"   Phase: {response.get('phase', 'N/A')}")
            return True
        return False

    def test_send_message(self, message_content, test_name, time_taken=None):
        """Test sending a message in the interview with time tracking"""
        if not self.interview_id:
            print("❌ Cannot send message - no interview ID")
            return False
            
        message_data = {
            "content": message_content
        }
        
        # Add time_taken if provided (simulating timer functionality)
        if time_taken is not None:
            message_data["time_taken"] = time_taken
        
        success, response = self.run_test(
            test_name,
            "POST",
            f"interviews/{self.interview_id}/message",
            200,
            data=message_data,
            timeout=60  # AI response may take longer
        )
        
        if success:
            print(f"   AI Response: {response.get('message', 'N/A')[:100]}...")
            print(f"   Phase: {response.get('phase', 'N/A')}")
            print(f"   Status: {response.get('status', 'N/A')}")
            print(f"   Question Number: {response.get('question_number', 'N/A')}")
        
        return success
    def test_video_upload(self):
        """Test video chunk upload"""
        if not self.interview_id:
            print("❌ Cannot upload video - no interview ID")
            return False
        
        # Create a mock video file (small binary data)
        mock_video_data = b"MOCK_VIDEO_DATA_CHUNK_" + b"0" * 100
        files = {'video': ('video_chunk.webm', mock_video_data, 'video/webm')}
        
        success, response = self.run_test(
            "Upload Video Chunk",
            "POST",
            f"interviews/{self.interview_id}/video",
            200,
            files=files
        )
        
        if success:
            print(f"   Video upload response: {response}")
        
        return success

    def test_get_messages(self):
        """Test getting message history"""
        if not self.interview_id:
            print("❌ Cannot get messages - no interview ID")
            return False
            
        success, response = self.run_test(
            "Get Message History",
            "GET",
            f"interviews/{self.interview_id}/messages",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Total Messages: {len(response)}")
            return True
        return False

    def test_get_interview_status(self):
        """Test getting interview status"""
        if not self.interview_id:
            print("❌ Cannot get interview - no interview ID")
            return False
            
        success, response = self.run_test(
            "Get Interview Status",
            "GET",
            f"interviews/{self.interview_id}",
            200
        )
        
        if success:
            print(f"   Phase: {response.get('phase', 'N/A')}")
            print(f"   Status: {response.get('status', 'N/A')}")
            print(f"   Current Question: {response.get('current_question', 'N/A')}")
            return True, response
        return False, {}

    def test_evaluate_interview(self):
        """Test interview evaluation"""
        if not self.interview_id:
            print("❌ Cannot evaluate - no interview ID")
            return False
            
        success, response = self.run_test(
            "Evaluate Interview",
            "POST",
            f"interviews/{self.interview_id}/evaluate",
            200,
            timeout=90  # Evaluation may take longer
        )
        
        if success:
            print(f"   Communication Score: {response.get('communication_score', 'N/A')}")
            print(f"   Technical Score: {response.get('technical_score', 'N/A')}")
            print(f"   Problem Solving Score: {response.get('problem_solving_score', 'N/A')}")
            print(f"   System Thinking Score: {response.get('system_thinking_score', 'N/A')}")
            print(f"   Total Score: {response.get('total_score', 'N/A')}")
            print(f"   Recommendation: {response.get('recommendation', 'N/A')}")
        
        return success

    def test_get_result(self):
        """Test getting interview result"""
        if not self.interview_id:
            print("❌ Cannot get result - no interview ID")
            return False
            
        success, response = self.run_test(
            "Get Interview Result",
            "GET",
            f"interviews/{self.interview_id}/result",
            200
        )
        
        if success:
            # Validate score ranges
            scores = ['communication_score', 'technical_score', 'problem_solving_score', 'system_thinking_score']
            valid_scores = True
            for score_field in scores:
                score = response.get(score_field, 0)
                if not (1 <= score <= 10):
                    print(f"   ⚠️  Invalid {score_field}: {score} (should be 1-10)")
                    valid_scores = False
            
            if valid_scores:
                print("   ✅ All scores are within valid range (1-10)")
            
            return success and valid_scores
        return False

def main():
    print("🚀 Starting AI Technical Interviewer API Tests")
    print("=" * 60)
    
    tester = AIInterviewerAPITester()
    
    # Setup authentication first
    if not tester.setup_test_user():
        print("💥 Failed to setup test user. Stopping tests.")
        return 1
    
    # Test authentication
    if not tester.test_auth_me():
        print("💥 Authentication failed. Stopping tests.")
        return 1
    
    # Test new features
    print("\n📋 Testing New Features...")
    if not tester.test_resume_parse():
        print("⚠️  Resume parsing failed")
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Create Candidate", tester.test_create_candidate),
        ("Start Interview", tester.test_start_interview),
    ]
    
    # Run initial tests
    for test_name, test_func in tests:
        if not test_func():
            print(f"\n💥 Critical failure in {test_name}. Stopping tests.")
            return 1
    
    # Test interview conversation flow with time tracking
    messages = [
        ("I'm ready to begin the interview. Let's start!", "Send Initial Message", 15),
        ("I have strong communication skills and experience working in teams. I'm passionate about Android development.", "Send Behavioral Response", 45),
        ("Kotlin is my primary language. I use MVVM architecture with Room for local storage and Retrofit for API calls.", "Send Technical Response", 60),
        ("I would start by analyzing the requirements, then design the architecture with scalability in mind.", "Send Problem Solving Response", 90),
    ]
    
    for message, test_name, time_taken in messages:
        if not tester.test_send_message(message, test_name, time_taken):
            print(f"\n⚠️  Message sending failed: {test_name}")
        time.sleep(2)  # Brief pause between messages
    
    # Test video upload functionality
    print(f"\n📹 Testing Video Upload...")
    if not tester.test_video_upload():
        print("⚠️  Video upload failed")
    
    # Continue conversation to reach completion
    print(f"\n📝 Continuing conversation to complete interview...")
    additional_messages = [
        "I believe in continuous learning and staying updated with latest technologies.",
        "For debugging, I use systematic approach with logs and breakpoints.",
        "I prefer agile methodology and collaborative development.",
        "My experience includes working with REST APIs and third-party integrations.",
        "I'm comfortable with Git version control and CI/CD pipelines.",
        "For testing, I use unit tests and UI automation testing.",
        "I have experience with Firebase and cloud services.",
        "Performance optimization is crucial for mobile apps.",
        "I follow clean code principles and design patterns.",
        "Thank you for the interview opportunity."
    ]
    
    for i, message in enumerate(additional_messages):
        success, interview_status = tester.test_get_interview_status()
        if success and interview_status.get('status') == 'completed':
            print(f"   ✅ Interview completed after {i} additional messages")
            break
            
        tester.test_send_message(message, f"Additional Message {i+1}", 30 + (i * 5))  # Varying response times
        time.sleep(2)
    
    # Test remaining endpoints
    remaining_tests = [
        ("Get Messages", tester.test_get_messages),
        ("Evaluate Interview", tester.test_evaluate_interview),
        ("Get Result", tester.test_get_result),
    ]
    
    for test_name, test_func in remaining_tests:
        test_func()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())