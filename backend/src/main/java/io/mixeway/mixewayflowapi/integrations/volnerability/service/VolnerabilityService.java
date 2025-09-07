package io.mixeway.mixewayflowapi.integrations.volnerability.service;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Map;

@Service
@Log4j2
public class VolnerabilityService {

    public String runSmokeTest() throws IOException, InterruptedException {
        log.info("Starting smoke tests via run_smoke.bat");

        // Project root
        String projectRoot = "D:/programowanie/ai-vulns/backend/volnerability-check-main";

        String batFile = "D:/programowanie/ai-vulns/backend/volnerability-check-main/scripts/run_smoke.bat";
        ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", batFile);

        // Set working directory to project root
        pb.directory(new File(projectRoot));

        // Merge stdout and stderr
        pb.redirectErrorStream(true);

        // Start the process
        Process process = pb.start();

        // Capture output in real-time
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                System.out.println(line); // Optional: log in real-time
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Smoke test failed with code " + exitCode + "\n" + output);
        }

        return output.toString();
    }
}
