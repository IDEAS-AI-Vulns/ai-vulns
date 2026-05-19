package io.mixeway.mixewayflowapi.modules.downloader.db.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@EqualsAndHashCode(exclude = "id")
@RequiredArgsConstructor
@Table(name = "downloader_log_errors")
public class DownloaderLogError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private final long id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "downloader_log_id")
    private final DownloaderLog downloaderLog;

    @Column
    private String vulnerabilityKey;

    @Column
    private String entity;

    @Column
    private String errorMessage;

    public DownloaderLogError() {
        id = 0;
        downloaderLog = null;
    }

    public DownloaderLogError(DownloaderLog downloaderLog, String entity, String errorMessage, String vulnerabilityKey) {
        this.id = 0;
        this.downloaderLog = downloaderLog;
        this.entity = entity;
        this.errorMessage = errorMessage;
        this.vulnerabilityKey = vulnerabilityKey;
    }
}
