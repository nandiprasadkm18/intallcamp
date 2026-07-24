import random
import time
from typing import Dict, Any, List

# A curated bank of simulated lecture lines to stream over WebSockets when transcription is started
LECTURE_TOPICS = {
    "CS101": [
        "Welcome class. Today we are diving into advanced microservices architectures and domain-driven design.",
        "When designing microservices, each service must hold its own database, preventing tight coupling.",
        "The primary challenge is managing distributed data transactions without standard two-phase commits.",
        "We often use the Saga Pattern to coordinate transactions across multiple independent services.",
        "In a Saga, every local transaction updates data and publishes a message or event to trigger the next step.",
        "If a step fails, compensating transactions are executed in reverse order to roll back changes.",
        "Let's write a simple compensation handler to see how this works in a distributed ledger.",
        "Next week, we will discuss event-driven patterns with Apache Kafka and RabbitMQ pipelines.",
    ],
    "AI502": [
        "Today we are analyzing Transformer architectures, specifically the self-attention mechanism.",
        "Self-attention allows the model to dynamically focus on different words in a sequence regardless of distance.",
        "The mathematical core depends on the Query, Key, and Value matrices, designated as Q, K, and V.",
        "We compute attention scores by taking the dot product of Query and Key, scaled by the square root of key dimension.",
        "Applying a softmax function ensures these scores are normalized and sum up to exactly one.",
        "Multiplying the softmax weights with the Value matrix yields the weighted attention output.",
        "This highly parallelizable structure is what made Recurrent Neural Networks obsolete for large datasets.",
        "Let us simulate this attention score matrix computation in the collaborative code workspace.",
    ]
}

AI_RESPONSES = [
    {
        "keywords": ["saga", "transaction", "compensate"],
        "answer": "The Saga Pattern manages transactions across microservices via a sequence of local transactions. Each updates the DB and publishes events. If one fails, the saga executes compensating transactions to restore consistency."
    },
    {
        "keywords": ["attention", "transformer", "self-attention", "matrix"],
        "answer": "Self-attention computes dynamic weights between token representations. By utilizing Query (Q), Key (K), and Value (V) matrices, it scores token relationships via Softmax(QK^T / sqrt(d_k))V."
    },
    {
        "keywords": ["jwt", "auth", "token", "secure"],
        "answer": "JSON Web Tokens (JWT) store claims securely between client and server. They consist of a Header, Payload, and Signature. The signature verifies the token hasn't been altered by utilizing the server's secret key."
    },
    {
        "keywords": ["websocket", "realtime", "connection"],
        "answer": "WebSockets maintain a persistent, full-duplex TCP connection, enabling instantaneous bidirectional communication. This is highly superior to HTTP polling for real-time dashboards."
    }
]

DEFAULT_ANSWERS = [
    "That is an excellent academic inquiry. Based on the current lecture transcript, the primary focal point is optimizing system reliability while preventing performance bottlenecks.",
    "Interesting doubt. Under standard enterprise conditions, this architectural style minimizes coupling and ensures higher horizontal scalability across application instances.",
    "Let's look at the mathematical formulations. Under high workloads, the complexity scales at O(N log N) which represents standard optimal performance for distributed lookups.",
    "A key concept here is fault tolerance. In modern frameworks, we mitigate this risk by adding redundancy, monitoring logs, and configuring standard fallback handlers."
]

class AIService:
    @staticmethod
    def generate_transcription_line(subject: str, step: int) -> Dict[str, Any]:
        """Simulates Whisper AI transcribing live speech."""
        topics = LECTURE_TOPICS.get(subject, LECTURE_TOPICS["CS101"])
        line_idx = step % len(topics)
        text = topics[line_idx]
        
        # Calculate mock Whisper metrics
        latency_ms = random.randint(120, 380)
        confidence = round(random.uniform(0.92, 0.99), 4)
        
        # Get simulated timestamp
        current_time = time.strftime("%H:%M:%S")
        
        return {
            "text": text,
            "timestamp": current_time,
            "latency_ms": latency_ms,
            "confidence": confidence
        }

    @staticmethod
    def ask_ai(question: str) -> Dict[str, Any]:
        """Simulates a highly capable LLM answering classroom doubts."""
        start_time = time.time()
        
        # Determine appropriate response based on keywords
        question_lower = question.lower()
        answer = None
        for item in AI_RESPONSES:
            if any(keyword in question_lower for keyword in item["keywords"]):
                answer = item["answer"]
                break
        
        if not answer:
            answer = random.choice(DEFAULT_ANSWERS)
            
        latency_ms = random.randint(250, 750)
        # Add artificial wait time to feel realistic
        time.sleep(latency_ms / 1000.0)
        
        prompt_tokens = len(question.split()) * 2 + 30
        completion_tokens = len(answer.split()) * 2 + 40
        
        return {
            "answer": answer,
            "latency_ms": latency_ms,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "model": "Llama-3-Academic-70B",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

    @staticmethod
    def get_classroom_sentiment() -> Dict[str, Any]:
        """Generates dynamic lecture sentiment and student engagement ratings."""
        engagement = round(random.uniform(78.5, 94.2), 1)
        focus_level = round(random.uniform(82.0, 96.5), 1)
        sentiment_positive = round(random.uniform(65.0, 85.0), 1)
        sentiment_neutral = round(random.uniform(10.0, 25.0), 1)
        sentiment_negative = round(100.0 - sentiment_positive - sentiment_neutral, 1)
        
        return {
            "engagement": engagement,
            "focus_level": focus_level,
            "sentiment": {
                "positive": sentiment_positive,
                "neutral": sentiment_neutral,
                "negative": sentiment_negative
            },
            "active_students": random.randint(42, 50),
            "timestamp": time.strftime("%H:%M:%S")
        }
