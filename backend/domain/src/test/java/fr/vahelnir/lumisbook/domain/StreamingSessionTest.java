package fr.vahelnir.lumisbook.domain;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class StreamingSessionTest {

    @Test
    void createSimpleStreamSession() {
        UserId userId = UserId.create();
        StreamingSession session = StreamingSession.create(userId);

        assertThat(session.ownerId()).isEqualTo(userId);
        assertThat(session.messages()).isEmpty();
        assertThat(session.invitedUserIds()).isEmpty();
    }

    @Test
    void createStreamSessionWithInvitedUsers() {
        UserId ownerId = UserId.create();
        StreamingSession session = StreamingSession.create(ownerId);
        UserId invitedUser1 = UserId.create();
        UserId invitedUser2 = UserId.create();
        var invitedUsers = Set.of(invitedUser1, invitedUser2);

        session.invite(invitedUsers);

        assertThat(session.ownerId()).isEqualTo(ownerId);
        assertThat(session.invitedUserIds())
            .hasSize(2)
            .containsExactlyInAnyOrder(invitedUser1, invitedUser2);
    }

    @Test
    void writeOneMessage() {
        User user = User.create("user1");
        StreamingSession session = user.createStreamSession();

        session.writeMessage(user.id(), "Hello");

        assertThat(session.messages())
            .hasSize(1);
        assertThat(session.messages())
            .containsExactly(new Message("Hello", user.id()));
    }

    @Test
    void writeMultipleMessages() {
        UserId userId = UserId.create();
        StreamingSession session = StreamingSession.create(userId);

        List<String> messages = List.of("Hello", "World");
        List<Message> expectedMessages = messages
                                             .stream()
                                             .map(text -> new Message(text, userId))
                                             .collect(Collectors.toList());

        for (String message : messages) {
            session.writeMessage(userId, message);
        }

        assertThat(session.ownerId()).isEqualTo(userId);
        assertThat(session.messages())
            .hasSize(2)
            .containsExactlyElementsOf(expectedMessages);
    }

    @Test
    void notAbleToWriteMessage_WhenUserIsNotOwner() {
        User owner = User.create("owner");
        User otherUser = User.create("otherUser");
        StreamingSession session = owner.createStreamSession();

        assertThatExceptionOfType(IllegalArgumentException.class)
            .isThrownBy(() -> session.writeMessage(otherUser.id(), "Hello"));
    }

    @Test
    void createWithMessages() {
        UserId ownerId = UserId.create();
        List<Message> messages = List.of(
            new Message("Hello", ownerId),
            new Message("World", ownerId)
        );

        StreamingSession session = StreamingSession.createWithMessages(ownerId, messages);

        assertThat(session.ownerId()).isEqualTo(ownerId);
        assertThat(session.messages())
            .hasSize(2)
            .containsExactlyElementsOf(messages);
    }

    @Test
    void designing() {
        User someone = User.create("someone");
        StreamingSession streamingSession = someone.createStreamSession();

        streamingSession.writeMessage(someone.id(), "Hello world!");
    }
}
