package AIntervier.embedding;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;

import java.io.*;
import java.util.List;

public class FileTextExtractor {

    public static String extractText(File file) throws Exception {
        String fileName = file.getName().toLowerCase();

        if (fileName.endsWith(".pdf")) {
            return extractFromPdf(file);
        } else if (fileName.endsWith(".docx")) {
            return extractFromDocx(file);
        } else if (fileName.endsWith(".txt")) {
            return extractFromTxt(file);
        } else {
            return extractWithTika(file);
        }
    }

    private static String extractFromPdf(File file) throws IOException {
        try (PDDocument document = PDDocument.load(file)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private static String extractFromDocx(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file);
             XWPFDocument doc = new XWPFDocument(fis)) {
            StringBuilder sb = new StringBuilder();
            List<XWPFParagraph> paragraphs = doc.getParagraphs();
            for (XWPFParagraph para : paragraphs) {
                sb.append(para.getText()).append("\n");
            }
            return sb.toString();
        }
    }

    private static String extractFromTxt(File file) throws IOException {
        return new String(java.nio.file.Files.readAllBytes(file.toPath()));
    }

    private static String extractWithTika(File file) throws IOException, TikaException {
        Tika tika = new Tika();
        return tika.parseToString(file);
    }
}

