package fr.vahelnir.lumisbook.domain;

import java.util.UUID;

public record StreamingSessionId(UUID uuid) {
    public static StreamingSessionId create() {
        return new StreamingSessionId(UUID.randomUUID());
    }
}
