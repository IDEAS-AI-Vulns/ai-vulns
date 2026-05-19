package io.mixeway.mixewayflowapi.modules.downloader.db.repository;

import io.mixeway.mixewayflowapi.modules.downloader.db.entity.DownloaderLogError;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DownloaderLogErrorsRepository extends JpaRepository<DownloaderLogError, Long> {

    List<DownloaderLogError> findByDownloaderLogId(Long downloaderLogId);
}