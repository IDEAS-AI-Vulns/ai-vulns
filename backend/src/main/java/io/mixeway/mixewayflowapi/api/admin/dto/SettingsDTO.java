package io.mixeway.mixewayflowapi.api.admin.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.mixeway.mixewayflowapi.utils.security.SecretMaskingSerializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsDTO {

    private Long id;

    private boolean authTypeUserPass;
    private boolean authTypeOAuth;

    private String oauthAppName;
    private String oauthIssuerUrl;

    private boolean scaModeEmbeded;
    private boolean scaModeExternal;
    private String scaApiUrl;
    private String scaApiKey;

    private String smtpHostname;
    private int smtpPort;
    private String smtpUsername;
    private boolean smtpTls;
    private boolean smtpStarttls;
    private boolean enableSmtp;

    private boolean enableWiz;
    private String wizClientId;

    @JsonSerialize(using = SecretMaskingSerializer.class)
    private String geminiApiKey;

    @JsonSerialize(using = SecretMaskingSerializer.class)
    private String openaiApiKey;

    @JsonSerialize(using = SecretMaskingSerializer.class)
    private String nistApiKey;
}
