package com.airesume.gateway;

import com.airesume.gateway.service.ResumeForwardingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:workflowtest;DB_CLOSE_DELAY=-1",
    "jwt.secret=QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo4OTAxMjM0NTY=",
    "app.bootstrap-admin.password=long-local-test-password",
    "ai-service.key=test-service-key",
    "app.resume-storage=./target/test-resumes"
})
@AutoConfigureMockMvc
class RecruitmentWorkflowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean ResumeForwardingService scoring;

    @Test
    void unauthorizedRecruiterEndpointsStayPrivate() throws Exception {
        mvc.perform(get("/api/jobs")).andExpect(status().isForbidden());
        mvc.perform(post("/api/jobs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Engineer\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/candidates/1/resume")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void draftPublishApplyReviewAndAudit() throws Exception {
        String create = mvc.perform(post("/api/jobs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Java Developer\",\"description\":\"Build services\",\"requiredSkills\":\"Java, SQL\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();
        long jobId = mapper.readTree(create).get("id").asLong();
        mvc.perform(get("/api/public/jobs")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + jobId + ")]").doesNotExist());
        mvc.perform(patch("/api/jobs/" + jobId + "/publish"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));
        mvc.perform(get("/api/public/jobs").with(anonymous()))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(jobId));
        mvc.perform(multipart("/api/public/jobs/" + jobId + "/apply")
                .file(new MockMultipartFile("resume", "fake.pdf", "application/pdf", "not a PDF".getBytes())).with(anonymous())
                .param("name", "Example Candidate").param("email", "candidate@example.test"))
                .andExpect(status().isBadRequest());
        MockMultipartFile resume = new MockMultipartFile("resume", "candidate.pdf", "application/pdf", "%PDF-1.4 sample text".getBytes());
        String receipt = mvc.perform(multipart("/api/public/jobs/" + jobId + "/apply")
                .file(resume).with(anonymous()).param("name", "Example Candidate").param("email", "candidate@example.test"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("RECEIVED"))
                .andReturn().getResponse().getContentAsString();
        long candidateId = mapper.readTree(receipt).get("applicationId").asLong();
        mvc.perform(get("/api/jobs/" + jobId + "/candidates"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].email").value("candidate@example.test"))
                .andExpect(jsonPath("$[0].resumeAvailable").value(true));
        mvc.perform(get("/api/candidates/" + candidateId + "/resume"))
                .andExpect(status().isOk()).andExpect(content().bytes("%PDF-1.4 sample text".getBytes()));
        mvc.perform(patch("/api/candidates/" + candidateId + "/stage").contentType(MediaType.APPLICATION_JSON)
                .content("{\"stage\":\"REJECTED\",\"reason\":\"\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/candidates/" + candidateId + "/stage").contentType(MediaType.APPLICATION_JSON)
                .content("{\"stage\":\"INTERVIEW\",\"reason\":\"Meets core requirements\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.stage").value("INTERVIEW"));
        mvc.perform(get("/api/candidates/" + candidateId + "/events"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].reason").value("Meets core requirements"));
    }
}
