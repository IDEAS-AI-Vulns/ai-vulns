package io.mixeway.mixewayflowapi.utils.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Converter
@Log4j2
public class ApiKeyEncryptor implements AttributeConverter<String, String> {

    @Value( "${encryption.algorithm}" )
    private String ALGORITHM;

    @Value( "${encryption.api-key-secret}" )
    private String encryptionKey;

    private SecretKeySpec getSecretKey() {
        // Decode Base64 key string to bytes
        byte[] decodedKey = Base64.getDecoder().decode(
                encryptionKey.trim()
        );
        return new SecretKeySpec(decodedKey, ALGORITHM);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey());
            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting API key", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey());
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(dbData));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch(IllegalArgumentException e) {
            log.error("Property stored in plaintext instead of encoded!");
            return dbData;

        }  catch (Exception e) {
            throw new RuntimeException("Error decrypting API key", e);
        }
    }
}