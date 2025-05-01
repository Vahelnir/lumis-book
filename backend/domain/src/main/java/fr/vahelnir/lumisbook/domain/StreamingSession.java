package fr.vahelnir.lumisbook.domain;

import java.util.*;

public final class StreamingSession {
    private final StreamingSessionId id = StreamingSessionId.create();
    private final UserId ownerId;
    private final List<Message> messages = new ArrayList<>();
    private final Set<UserId> invitedUserIds = new HashSet<>();
    private final Set<ListeningUser> listeningUsers = new HashSet<>();

    private StreamingSession(UserId ownerId) {
        this.ownerId = ownerId;
    }

    public void writeMessage(UserId userId, String message) {
        if (!userId.equals(ownerId)) {
            throw new IllegalArgumentException("Only the owner can write a messages");
        }

        // TODO: see if I need to create a Repository for this ?
        messages.add(new Message(message, userId));

        for (ListeningUser listeningUser : listeningUsers) {
            listeningUser.forward(new Message(message, userId));
        }
    }

    public void invite(UserId userId) {
        invitedUserIds.add(userId);
    }

    public void invite(Collection<UserId> userIds) {
        invitedUserIds.addAll(userIds);
    }

    public void connect(ListeningUser listeningUser) {
        if (!isInvited(listeningUser.getUserId())) {
            throw new IllegalArgumentException("You are not invited to this streaming session");
        }

        if (listeningUsers.contains(listeningUser)) {
            return;
        }

        listeningUsers.add(listeningUser);
    }

    public boolean isInvited(UserId userId) {
        return invitedUserIds.contains(userId) || ownerId.equals(userId);
    }

    public StreamingSessionId id() {
        return id;
    }

    public UserId ownerId() {
        return ownerId;
    }

    public List<Message> messages() {
        return messages;
    }

    public Set<UserId> invitedUserIds() {
        return invitedUserIds;
    }

    public static StreamingSession create(UserId userId) {
        return new StreamingSession(userId);
    }

    public static StreamingSession createWithMessages(UserId ownerId, List<Message> messages) {
        StreamingSession session = new StreamingSession(ownerId);
        session.messages.addAll(messages);
        return session;
    }
}
