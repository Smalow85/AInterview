package AIntervier.rest.data;

public class ChatResponse {
    private String reply;

    public ChatResponse(String reply) {
        this.reply = reply;
    }

    public ChatResponse() {
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
