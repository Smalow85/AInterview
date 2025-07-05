package AIntervier.rest.data;

import java.util.List;

public class InterviewQestionRequest {

    private String sessionId;
    private String jobTitle;
    private String requiredExperience;
    private String resumeContent;
    private List<String> keySkills;

    public InterviewQestionRequest() {
    }

    public InterviewQestionRequest(String sessionId, String jobTitle, String requiredExperience, String resumeContent, List<String> keySkills) {
        this.sessionId = sessionId;
        this.jobTitle = jobTitle;
        this.requiredExperience = requiredExperience;
        this.resumeContent = resumeContent;
        this.keySkills = keySkills;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getRequiredExperience() {
        return requiredExperience;
    }

    public void setRequiredExperience(String requiredExperience) {
        this.requiredExperience = requiredExperience;
    }

    public String getResumeContent() {
        return resumeContent;
    }

    public void setResumeContent(String resumeContent) {
        this.resumeContent = resumeContent;
    }

    public List<String> getKeySkills() {
        return keySkills;
    }

    public void setKeySkills(List<String> keySkills) {
        this.keySkills = keySkills;
    }
}
