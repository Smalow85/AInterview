package AIntervier.rest.data;

import java.util.List;

public class ConversationRequest {
    private String theme;
    private List<String> keySkills;

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public List<String> getKeySkills() {
        return keySkills;
    }

    public void setKeySkills(List<String> keySkills) {
        this.keySkills = keySkills;
    }
}

