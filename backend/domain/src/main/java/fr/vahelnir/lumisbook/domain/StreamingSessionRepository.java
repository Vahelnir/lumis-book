package fr.vahelnir.lumisbook.domain;

public interface StreamingSessionRepository {
    StreamingSession findById(StreamingSessionId streamingSessionId);
}
