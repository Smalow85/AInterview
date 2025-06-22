package AIntervier.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class InterviewQuestionService {

    public List<String> generateQuestions(String sessionId, String jobTitle, String requiredExperience, String resumeContent,List<String> keySkills) {
        List<String> extractedSkills = new ArrayList<>();
        if (resumeContent != null) {
            extractedSkills = extractSkillsFromResume(resumeContent); //Implementation for extracting from resume content
        }

        Set<String> allSkills = new HashSet<>(extractedSkills);
        allSkills.addAll(keySkills);

        return generateQuestionsFromLLM(jobTitle, requiredExperience, allSkills);
    }

    private List<String> extractSkillsFromResume(String resumeContent) {
        return List.of(); //Placeholder
    }

    private List<String> generateQuestionsFromLLM(String jobTitle, String requiredExperience, Set<String> allSkills) {
        return List.of("What do you think about AI in context of Java?", "What you can say about generics in Java?");
    }
}