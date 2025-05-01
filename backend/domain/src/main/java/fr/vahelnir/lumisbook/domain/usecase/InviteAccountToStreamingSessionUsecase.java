package fr.vahelnir.lumisbook.domain.usecase;

import fr.vahelnir.lumisbook.domain.StreamingSession;
import fr.vahelnir.lumisbook.domain.StreamingSessionId;
import fr.vahelnir.lumisbook.domain.StreamingSessionRepository;
import fr.vahelnir.lumisbook.domain.UserId;

public class InviteAccountToStreamingSessionUsecase {
    private final StreamingSessionRepository streamingSessionRepository;

    public InviteAccountToStreamingSessionUsecase(StreamingSessionRepository streamingSessionRepository) {
        this.streamingSessionRepository = streamingSessionRepository;
    }

    public void execute(UserId owner, StreamingSessionId streamingSessionId, UserId userIdToInvite) {
        StreamingSession streamingSession = streamingSessionRepository.findById(streamingSessionId);
        if (streamingSession.ownerId().equals(owner)) {
            streamingSession.invite(userIdToInvite);
        } else {
            throw new IllegalArgumentException("You are not the owner of this streaming session.");
        }
    }
}
