package io.mixeway.mixewayflowapi.domain.team;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.security.Principal;
import java.util.ArrayList;


@SpringBootTest
@ExtendWith(SpringExtension.class)
@ActiveProfiles("ut")
class CreateTeamServiceTest {
    @Autowired
    CreateTeamService createTeamService;
    @Mock
    Principal principal;

    @Test
    void createTeam() {
        Mockito.when(principal.getName()).thenReturn("admin");
        createTeamService.createTeam("test","test", new ArrayList<>(), principal);
    }
}