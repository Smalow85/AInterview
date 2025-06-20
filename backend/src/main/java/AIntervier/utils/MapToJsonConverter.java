package AIntervier.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.HashMap;
import java.util.Map;

@Converter(autoApply = false)
public class MapToJsonConverter implements AttributeConverter<Map<String, Object>, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null || attribute.isEmpty()) return "{}";
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not convert Map to JSON", e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(dbData, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not convert JSON to Map", e);
        }
    }
}