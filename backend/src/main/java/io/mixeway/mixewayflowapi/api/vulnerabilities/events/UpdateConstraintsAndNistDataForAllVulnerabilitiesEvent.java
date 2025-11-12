package io.mixeway.mixewayflowapi.api.vulnerabilities.events;

import org.springframework.context.ApplicationEvent;

public class UpdateConstraintsAndNistDataForAllVulnerabilitiesEvent extends ApplicationEvent {

    public UpdateConstraintsAndNistDataForAllVulnerabilitiesEvent(Object source) {
        super(source);
    }
}
