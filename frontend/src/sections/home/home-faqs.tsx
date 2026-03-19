import type { FC } from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import ChevronDownIcon from '@untitled-ui/icons-react/build/esm/ChevronDown';
import ChevronRightIcon from '@untitled-ui/icons-react/build/esm/ChevronRight';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';

interface FaqType {
  question: string;
  answer: string;
}

const faqs: FaqType[] = [
  {
    question: 'What is AI fairness testing?',
    answer:
      'AI fairness testing evaluates machine learning models to identify and reduce biases, ensuring equitable outcomes across diverse groups.',
  },
  {
    question: 'Who can benefit from this tool?',
    answer:
      'Researchers, developers, and organizations aiming to create ethical AI models and maintain compliance with fairness standards can all benefit.',
  },
  {
    question: 'What types of AI models can be tested?',
    answer:
      'Our tool supports a wide range of models, including classification, regression, and recommendation systems.',
  },
  {
    question: 'How does this tool detect bias?',
    answer:
      'By analyzing model predictions against protected attributes and fairness metrics, it highlights disparities and areas of improvement.',
  },
  {
    question: 'Is the tool easy to integrate into existing workflows?',
    answer:
      'Yes, it is designed with flexibility in mind, making integration seamless for any team or platform.',
  },
];

interface FaqProps {
  answer: string;
  question: string;
}

const Faq: FC<FaqProps> = (props) => {
  const { answer, question } = props;
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <Paper
      onClick={() => setIsExpanded((prevState) => !prevState)}
      elevation={0}
      sx={{
        cursor: 'pointer',
        border: '1px solid',
        borderColor: isExpanded ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 2.5,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.light',
        },
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={2}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600 }}
        >
          {question}
        </Typography>
        <SvgIcon
          sx={{
            color: 'primary.main',
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          <ChevronDownIcon />
        </SvgIcon>
      </Stack>
      <Collapse in={isExpanded}>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mt: 1.5, lineHeight: 1.7 }}
        >
          {answer}
        </Typography>
      </Collapse>
    </Paper>
  );
};

Faq.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
};

export const HomeFaqs: FC = () => {
  return (
    <Box
      id="faq"
      sx={{ py: '120px', backgroundColor: 'background.default' }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={4}
        >
          <Grid
            xs={12}
            md={5}
          >
            <Stack
              spacing={2}
              sx={{ position: 'sticky', top: 100 }}
            >
              <Typography
                variant="overline"
                color="primary.main"
                sx={{ fontWeight: 700, letterSpacing: 2 }}
              >
                FAQ
              </Typography>
              <Typography variant="h3">Everything you need to know</Typography>
              <Typography
                color="text.secondary"
                variant="body1"
              >
                Can't find the answer you're looking for? Feel free to explore the demo and see how
                the tool works in practice.
              </Typography>
            </Stack>
          </Grid>
          <Grid
            xs={12}
            md={7}
          >
            <Stack spacing={2}>
              {faqs.map((faq, index) => (
                <Faq
                  key={index}
                  {...faq}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
