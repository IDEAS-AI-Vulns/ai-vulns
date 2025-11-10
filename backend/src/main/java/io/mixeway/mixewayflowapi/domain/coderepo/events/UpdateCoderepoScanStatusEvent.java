package io.mixeway.mixewayflowapi.domain.coderepo.events;

import io.mixeway.mixewayflowapi.db.entity.CodeRepo;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class UpdateCoderepoScanStatusEvent extends ApplicationEvent {

    private final CodeRepo repository;
    private final CodeRepo.ScanStatus scanStatus;

    public UpdateCoderepoScanStatusEvent(CodeRepo repository, CodeRepo.ScanStatus scanStatus) {
        super(repository);
        this.repository = repository;
        this.scanStatus = scanStatus;
    }
}
