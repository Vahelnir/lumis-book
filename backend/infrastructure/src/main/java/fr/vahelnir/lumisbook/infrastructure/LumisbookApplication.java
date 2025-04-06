package fr.vahelnir.lumisbook.infrastructure;

import fr.vahelnir.lumisbook.domain.Message;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SpringBootApplication
public class LumisbookApplication {

	public static void main(String[] args) {
		SpringApplication.run(LumisbookApplication.class, args);
	}

    @RequestMapping("/")
    String home() {
        Message message = new Message("Hello World!");
        return message.text();
    }
}
