package io.mixeway.mixewayflowapi.utils.security;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

public class SecretMaskingSerializer extends JsonSerializer<String> {

    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null || value.isEmpty()) {
            gen.writeNull();
            return;
        }
        // pokaż tylko ostatnie 4 znaki
        int visible = Math.min(4, value.length());
        String masked = "*".repeat(Math.max(0, value.length() - visible)) + value.substring(value.length() - visible);
        gen.writeString(masked);
    }
}