package AIntervier.service;

import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

@Service
public class FileParserService {

    public String parseTextFile(InputStream is) {
        return new BufferedReader(new InputStreamReader(is))
                .lines()
                .collect(Collectors.joining("\n"));
    }
}