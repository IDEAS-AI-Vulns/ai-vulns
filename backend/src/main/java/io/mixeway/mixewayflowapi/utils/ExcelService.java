package io.mixeway.mixewayflowapi.utils;

import io.mixeway.mixewayflowapi.db.entity.Constraint;
import io.mixeway.mixewayflowapi.db.entity.Finding;
import io.mixeway.mixewayflowapi.db.entity.Vulnerability;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Log4j2
public class ExcelService {

    public static String createVulnerabilitySummaryExcel(List<Vulnerability> vulnerabilities, String repoUrl, String repoName, String path) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Data");
            createHeaderRow(sheet);

            int cnt = 1;
            for(Vulnerability vulnerability: vulnerabilities) {
                if(vulnerability.getName().startsWith("CVE")) {
                    createVulnerabilityRow(sheet, vulnerability, repoUrl, cnt);
                    cnt = cnt + 1;
                }
            }
            log.info("Writing to file {}", path + File.separator + repoName + ".xlsx");
            // Write to file
            try (FileOutputStream out = new FileOutputStream(path + File.separator + repoName + ".xlsx")) {
                workbook.write(out);
            }
        return null;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static void createVulnerabilityRow(Sheet sheet, Vulnerability vulnerability, String repoUrl, int cnt) {
        Row row = sheet.createRow(cnt);
        row.createCell(0).setCellValue(vulnerability.getName());
        row.createCell(1).setCellValue(vulnerability.getDescription());
        row.createCell(2).setCellValue(vulnerability.getConstraints()
                                                        .stream()
                                                        .map(Constraint::getText)
                                                        .collect(Collectors.joining("; ")));
        row.createCell(3).setCellValue(repoUrl);
    }

    private static void createHeaderRow(Sheet sheet) {
        Row row = sheet.createRow(0);
        row.createCell(0).setCellValue("Name");
        row.createCell(1).setCellValue("Summary");
        row.createCell(2).setCellValue("Constraints");
        row.createCell(3).setCellValue("Repository");
        row.createCell(4).setCellValue("Probability");
        row.createCell(5).setCellValue("Exploitable");
    }

}
