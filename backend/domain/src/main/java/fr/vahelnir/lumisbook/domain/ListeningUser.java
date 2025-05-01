package fr.vahelnir.lumisbook.domain;

public interface ListeningUser {
    UserId getUserId();

    void receiveMessage(Message message);

    void forward(Message message);
}
