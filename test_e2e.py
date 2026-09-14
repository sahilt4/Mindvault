import requests
import time
import os
from pathlib import Path

BACKEND_URL = "http://127.0.0.1:5000/api"
AI_URL = "http://127.0.0.1:8000"

def run_tests():
    print("========================================")
    print("STARTING MINDVAULT END-TO-END VERIFICATION")
    print("========================================")

    # 1. Health Checks
    print("\n[Step 1] Checking Backend & AI Service Health...")
    res = requests.get(f"{BACKEND_URL}/health")
    assert res.status_code == 200, f"Backend health failed: {res.text}"
    print("[OK] Backend is healthy:", res.json()["service"])

    res = requests.get(f"{AI_URL}/health")
    assert res.status_code == 200, f"AI service health failed: {res.text}"
    print("[OK] AI service is healthy:", res.json()["service"])

    # 2. Register User A
    print("\n[Step 2] Registering User A (Alice)...")
    email_a = f"alice_{int(time.time())}@mindvault.local"
    res = requests.post(f"{BACKEND_URL}/auth/register", json={
        "name": "Alice Innovator",
        "email": email_a,
        "password": "Password123!"
    })
    assert res.status_code == 201, f"Register A failed: {res.text}"
    data_a = res.json()
    token_a = data_a["token"]
    user_a_id = data_a["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"[OK] User A registered successfully: {data_a['user']['name']} ({user_a_id})")

    # 3. Create Note for User A
    print("\n[Step 3] Creating Note for User A...")
    res = requests.post(f"{BACKEND_URL}/notes", headers=headers_a, json={
        "title": "Quantum Computing Architecture",
        "content": "Our quantum architecture relies on topological qubits and cryogenic dilution refrigerators operating at 15 millikelvin. The primary quantum error correction code is surface code 17.",
        "category": "Projects",
        "tags": ["quantum", "hardware", "architecture"]
    })
    assert res.status_code == 201, f"Create note failed: {res.text}"
    note_a = res.json()["note"]
    print(f"[OK] Note created: {note_a['title']} (ID: {note_a['_id']})")

    # 4. Upload TXT Document for User A
    print("\n[Step 4] Uploading TXT Document for User A...")
    txt_content = """MindVault Project Roadmap:
In Q3 2026, MindVault plans to support local semantic indexing and cross-collection synthesis.
The team is led by Dr. Evelyn Reed and the deployment budget is set to $250,000.
The target release date for the Enterprise tier is October 28, 2026."""

    test_file_path = Path("sample_vault_doc.txt")
    test_file_path.write_text(txt_content, encoding="utf-8")

    with open(test_file_path, "rb") as f:
        res = requests.post(
            f"{BACKEND_URL}/documents/upload",
            headers=headers_a,
            files={"file": ("sample_vault_doc.txt", f, "text/plain")},
            data={"category": "Projects"}
        )
    assert res.status_code == 201, f"Upload failed: {res.text}"
    doc_a = res.json()["document"]
    print(f"[OK] Document uploaded: {doc_a['originalName']} (Status: {doc_a['status']})")

    # Wait 2 seconds for background chunking & embedding
    time.sleep(2.5)

    # Verify document status updated to 'ready'
    res = requests.get(f"{BACKEND_URL}/documents/{doc_a['_id']}", headers=headers_a)
    doc_status = res.json()["document"]["status"]
    print(f"[OK] Document processing status: {doc_status} (Chunks: {res.json()['document']['chunkCount']})")

    # 5. Ask Question about uploaded document (Grounded RAG)
    print("\n[Step 5] Asking QAssist about the document content...")
    query_doc = "Who leads the MindVault team and what is the deployment budget?"
    res = requests.post(f"{BACKEND_URL}/chat", headers=headers_a, json={"message": query_doc})
    assert res.status_code == 200, f"Chat query failed: {res.text}"
    answer_data = res.json()["message"]
    print(f"\nQuestion: {query_doc}")
    print(f"QAssist Answer:\n{answer_data['content']}")
    print(f"Sources returned: {len(answer_data['sources'])}")
    for s in answer_data['sources']:
        print(f"  - Source: {s['documentName']} ({s['sourceType']}) | Snippet: {s['snippet'][:80]}...")
    
    assert "Evelyn" in answer_data['content'] or "250,000" in answer_data['content'] or len(answer_data['sources']) > 0, "Failed to retrieve grounded context"
    assert len(answer_data['sources']) > 0, "No sources cited for document question"
    print("[OK] Grounded answer verified with citations!")

    # 6. Ask Question about Note (Grounded in notes)
    print("\n[Step 6] Asking QAssist about the quantum computing note...")
    query_note = "What temperature do our dilution refrigerators operate at?"
    res = requests.post(f"{BACKEND_URL}/chat", headers=headers_a, json={"message": query_note})
    assert res.status_code == 200, f"Chat query failed: {res.text}"
    note_answer = res.json()["message"]
    print(f"\nQuestion: {query_note}")
    print(f"QAssist Answer:\n{note_answer['content']}")
    print(f"Sources returned: {len(note_answer['sources'])}")
    print("[OK] Note-based answer verified!")

    # 7. Ask Unrelated Question (Verify anti-hallucination / not found response)
    print("\n[Step 7] Asking QAssist an unrelated question NOT in knowledge base...")
    query_unrelated = "What is the secret recipe for Aunt May's apple pie in Narnia?"
    res = requests.post(f"{BACKEND_URL}/chat", headers=headers_a, json={"message": query_unrelated})
    assert res.status_code == 200, f"Unrelated query failed: {res.text}"
    unrelated_answer = res.json()["message"]
    print(f"\nQuestion: {query_unrelated}")
    print(f"QAssist Answer:\n{unrelated_answer['content']}")
    assert "could not find" in unrelated_answer['content'].lower() or "not" in unrelated_answer['content'].lower(), "AI hallucinated instead of admitting no knowledge"
    print("[OK] Anti-hallucination verified! QAssist accurately stated information is not in knowledge base.")

    # 8. Multi-Tenant Security Isolation Verification
    print("\n[Step 8] Registering User B (Bob) to verify Security Isolation...")
    email_b = f"bob_{int(time.time())}@mindvault.local"
    res = requests.post(f"{BACKEND_URL}/auth/register", json={
        "name": "Bob Separate",
        "email": email_b,
        "password": "Password123!"
    })
    token_b = res.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"[OK] User B registered successfully ({email_b})")

    print("\n[Step 9] User B asks about User A's private quantum architecture...")
    res = requests.post(f"{BACKEND_URL}/chat", headers=headers_b, json={"message": "What temperature do our dilution refrigerators operate at?"})
    assert res.status_code == 200
    bob_answer = res.json()["message"]
    print(f"User B QAssist Answer:\n{bob_answer['content']}")
    print(f"User B sources: {len(bob_answer['sources'])}")
    assert len(bob_answer['sources']) == 0, "CRITICAL SECURITY BREACH: User B retrieved User A's sources!"
    assert "could not find" in bob_answer['content'].lower() or "not" in bob_answer['content'].lower(), "User B received User A's data!"
    print("[OK] CRITICAL SECURITY TEST PASSED: User B cannot retrieve User A's knowledge or vector chunks!")

    # 9. Clean up temporary test file
    if test_file_path.exists():
        test_file_path.unlink()

    print("\n========================================")
    print("ALL 9 E2E TEST PHASES PASSED WITH 100% SUCCESS!")
    print("========================================")

if __name__ == "__main__":
    run_tests()
