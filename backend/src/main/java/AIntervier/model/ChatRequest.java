package AIntervier.model;

public class ChatRequest {
    private String sessionId;
    private String message;
    private boolean stop;

    public ChatRequest() {
    }

    public ChatRequest(String sessionId, String message) {
        this.sessionId = sessionId;
        this.message = message;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isStop() {
        return stop;
    }

    public void setStop(boolean stop) {
        this.stop = stop;
    }
}

