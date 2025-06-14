package AIntervier.model;

import java.io.Serializable;

public class MessageField implements Serializable {
    private String text;

    public MessageField(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    @Override
    public String toString() {
        return "MessageField{" +
                "text='" + text + '\'' +
                '}';
    }
}
