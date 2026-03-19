import { Box, Container, Typography, Stack } from '@mui/material';

import Grid from '@mui/system/Unstable_Grid';

export interface TeamMemberItem {
  name: string;
  role: string;
  github?: string;
  linkedin?: string;
  isAdvisor?: boolean;
  description?: string;
  skills?: string[];
}

const teamMembers: TeamMemberItem[] = [
  {
    name: 'Asst. Prof. Dr. Ayşe Tosun',
    role: 'Project Advisor',
    linkedin: 'https://www.linkedin.com/in/gulsen-eryigit-5a066613',
    isAdvisor: true,
    skills: ['Software Engineering'],
    description:
      'Professor at Istanbul Technical University, Department of Computer Engineering. Research interests include Natural Language Processing and Machine Learning.',
  },
  {
    name: 'Umutcan Karakaş',
    role: 'Project Lead',
    skills: ['Artificial Intelligence', 'Machine Learning'],
    github: '#',
    linkedin: '#',
    description:
      'Computer Engineering student at ITU, focusing on AI fairness and bias detection in machine learning systems.',
  },
  {
    name: 'Furkan Topaloğlu',
    role: 'Team Member',
    skills: ['System Architecture', 'Devops'],
    github: '#',
    linkedin: '#',
    description:
      'Computer Engineering student at ITU, focusing on AI fairness and bias detection in machine learning systems.',
  },
  {
    name: 'Baturalp İnce',
    role: 'Team Member',
    skills: ['Backend Development', 'Frontend Development'],
    github: '#',
    linkedin: '#',
    description:
      'Computer Engineering student at ITU, interested in machine learning and algorithmic fairness.',
  },
  {
    name: 'Altay',
    role: 'Team Member',
    skills: ['Backend Development', 'Frontend Development'],
    github: '#',
    linkedin: '#',
    description:
      'Computer Engineering student at ITU, passionate about AI ethics and fair machine learning.',
  },
];

export const HomeTeam = () => {
  return (
    <Box
      id="teams"
      sx={{
        backgroundColor: 'background.paper',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Stack
          spacing={3}
          sx={{ mb: { xs: 8, md: 10 }, textAlign: 'center' }}
        >
          <Typography
            variant="h3"
            sx={{ fontWeight: 700 }}
          >
            Meet Our Team
          </Typography>
          <Typography
            color="text.secondary"
            variant="subtitle1"
          >
            The talented individuals behind BeeFAME, working together to advance fairness and ethics
            in artificial intelligence
          </Typography>
        </Stack>

        <Grid
          container
          spacing={4}
        >
          {teamMembers.map((member) => (
            <Grid
              key={member.name}
              md={4}
            >
              {/* <TeamMember member={member} /> */}
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
