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

    @Test
    @WithMockUser(roles = "ADMIN")
    void candidateRejectedInOneJobIsNotRejectedInAnotherJob() throws Exception {
        // Create Job 1 and Job 2
        String j1 = mvc.perform(post("/api/jobs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Job 1\",\"description\":\"Desc 1\",\"requiredSkills\":\"Java\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long job1Id = mapper.readTree(j1).get("id").asLong();
        mvc.perform(patch("/api/jobs/" + job1Id + "/publish")).andExpect(status().isOk());

        String j2 = mvc.perform(post("/api/jobs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Job 2\",\"description\":\"Desc 2\",\"requiredSkills\":\"Python\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long job2Id = mapper.readTree(j2).get("id").asLong();
        mvc.perform(patch("/api/jobs/" + job2Id + "/publish")).andExpect(status().isOk());

        // Same candidate applies to both Job 1 and Job 2
        MockMultipartFile resume1 = new MockMultipartFile("resume", "cand.pdf", "application/pdf", "%PDF-1.4 text".getBytes());
        String r1 = mvc.perform(multipart("/api/public/jobs/" + job1Id + "/apply")
                .file(resume1).with(anonymous()).param("name", "Multi Applicant").param("email", "multi@example.test"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long cand1Id = mapper.readTree(r1).get("applicationId").asLong();

        MockMultipartFile resume2 = new MockMultipartFile("resume", "cand.pdf", "application/pdf", "%PDF-1.4 text".getBytes());
        String r2 = mvc.perform(multipart("/api/public/jobs/" + job2Id + "/apply")
                .file(resume2).with(anonymous()).param("name", "Multi Applicant").param("email", "multi@example.test"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long cand2Id = mapper.readTree(r2).get("applicationId").asLong();

        // Reject candidate in Job 1
        mvc.perform(patch("/api/candidates/" + cand1Id + "/stage").contentType(MediaType.APPLICATION_JSON)
                .content("{\"stage\":\"REJECTED\",\"reason\":\"Not a fit for Job 1\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.stage").value("REJECTED"));

        // Verify candidate in Job 1 is REJECTED
        mvc.perform(get("/api/jobs/" + job1Id + "/candidates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(cand1Id))
                .andExpect(jsonPath("$[0].stage").value("REJECTED"));

        // Verify candidate in Job 2 is STILL "NEW" (NOT automatically rejected)
        mvc.perform(get("/api/jobs/" + job2Id + "/candidates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(cand2Id))
                .andExpect(jsonPath("$[0].stage").value("NEW"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void closeRecruitmentPermanentlyDeletesCandidateDataAndPreventsRepublish() throws Exception {
        // Create and publish Job
        String j = mvc.perform(post("/api/jobs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Closing Role\",\"description\":\"Desc\",\"requiredSkills\":\"Go\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long jobId = mapper.readTree(j).get("id").asLong();
        mvc.perform(patch("/api/jobs/" + jobId + "/publish")).andExpect(status().isOk());

        // Apply
        MockMultipartFile resume = new MockMultipartFile("resume", "closing.pdf", "application/pdf", "%PDF-1.4 text".getBytes());
        mvc.perform(multipart("/api/public/jobs/" + jobId + "/apply")
                .file(resume).with(anonymous()).param("name", "Closing Applicant").param("email", "closing@example.test"))
                .andExpect(status().isCreated());

        // Verify 1 candidate exists
        mvc.perform(get("/api/jobs/" + jobId + "/candidates"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));

        // Pause job: can be republished
        mvc.perform(patch("/api/jobs/" + jobId + "/pause"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAUSED"));
        mvc.perform(patch("/api/jobs/" + jobId + "/publish"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));

        // Close recruitment
        mvc.perform(patch("/api/jobs/" + jobId + "/close"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CLOSED"));

        // Candidate dataset and job must be permanently cleared from database and recruiter list
        mvc.perform(get("/api/jobs/" + jobId + "/candidates"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + jobId + ")]").doesNotExist());

        // Job must be removed from public careers portal
        mvc.perform(get("/api/public/jobs").with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + jobId + ")]").doesNotExist());

        // Cannot publish closed job again
        mvc.perform(patch("/api/jobs/" + jobId + "/publish"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void singleApplicationPerActiveJobRoleWithCaseInsensitiveEmail() throws Exception {
        // Create Job 1 and Job 2
        String j1 = mvc.perform(post("/api/jobs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Frontend Role\",\"description\":\"React\",\"requiredSkills\":\"React\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long job1Id = mapper.readTree(j1).get("id").asLong();
        mvc.perform(patch("/api/jobs/" + job1Id + "/publish")).andExpect(status().isOk());

        String j2 = mvc.perform(post("/api/jobs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Backend Role\",\"description\":\"Spring\",\"requiredSkills\":\"Java\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long job2Id = mapper.readTree(j2).get("id").asLong();
        mvc.perform(patch("/api/jobs/" + job2Id + "/publish")).andExpect(status().isOk());

        // 1. First application to Job 1 succeeds
        MockMultipartFile resume1 = new MockMultipartFile("resume", "cand.pdf", "application/pdf", "%PDF-1.4 text".getBytes());
        mvc.perform(multipart("/api/public/jobs/" + job1Id + "/apply")
                .file(resume1).with(anonymous())
                .param("name", "Jane Doe")
                .param("email", "Jane.Doe@Example.COM"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RECEIVED"));

        // 2. Duplicate application to Job 1 with different case email fails with 409 Conflict
        MockMultipartFile resume2 = new MockMultipartFile("resume", "cand.pdf", "application/pdf", "%PDF-1.4 text".getBytes());
        mvc.perform(multipart("/api/public/jobs/" + job1Id + "/apply")
                .file(resume2).with(anonymous())
                .param("name", "Jane Doe")
                .param("email", "jane.doe@example.com"))
                .andExpect(status().isConflict())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("already submitted an application for this position")));

        // 3. Application to Job 2 with same email SUCCEEDS (eligible to apply for other roles)
        MockMultipartFile resume3 = new MockMultipartFile("resume", "cand.pdf", "application/pdf", "%PDF-1.4 text".getBytes());
        mvc.perform(multipart("/api/public/jobs/" + job2Id + "/apply")
                .file(resume3).with(anonymous())
                .param("name", "Jane Doe")
                .param("email", "JANE.DOE@example.com"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RECEIVED"));
    }
}
