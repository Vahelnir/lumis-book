package fr.vahelnir.lumisbook.domain;

import java.util.UUID;

public record UserId(UUID id) {
    static UserId create() {
        return new UserId(UUID.randomUUID());
    }
}
