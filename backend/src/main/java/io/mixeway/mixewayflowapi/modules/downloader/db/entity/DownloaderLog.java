package io.mixeway.mixewayflowapi.modules.downloader.db.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@EqualsAndHashCode(exclude = "id")
@RequiredArgsConstructor
@Table(name = "downloader_log")
public class DownloaderLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private final long id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column
    private String status;

    @Column
    private long processed;

    @Column
    private long error;

    @OneToMany(mappedBy = "downloaderLog", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DownloaderLogError> errors = new ArrayList<>();

    public DownloaderLog() {
        id = 0;
    }

    public DownloaderLog(String status, long processed, long error) {
        this.id = 0;
        this.status = status;
        this.processed = processed;
        this.error = error;
        this.errors = new ArrayList<>();
    }
}
