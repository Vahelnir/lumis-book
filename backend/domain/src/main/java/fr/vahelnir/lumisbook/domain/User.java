package fr.vahelnir.lumisbook.domain;

public record User(UserId id, String username) {
    public static User create(String username) {
        return new User(UserId.create(), username);
    }

    public static User create(UserId id, String username) {
        return new User(id, username);
    }

    public StreamingSession createStreamSession() {
        return StreamingSession.create(id);
    }
}
