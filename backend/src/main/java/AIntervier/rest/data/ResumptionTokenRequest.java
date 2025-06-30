package AIntervier.rest.data;

public class ResumptionTokenRequest {
    private String sessionId;
    private String resumptionToken;

    public ResumptionTokenRequest(String sessionId, String resumptionToken) {
        this.sessionId = sessionId;
        this.resumptionToken = resumptionToken;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getResumptionToken() {
        return resumptionToken;
    }

    public void setResumptionToken(String resumptionToken) {
        this.resumptionToken = resumptionToken;
    }
}