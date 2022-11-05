import React from 'react';
import styled from 'styled-components';
import { Header } from '../Header';
import { P } from './P';

export function ErrorComponent({ title, message }) {
  return (
    <Wrapper>
      <Header />
      <Title>{title}</Title>
      <P>{message}</P>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 320px;
`;

const Title = styled.div`
  margin-top: -8vh;
  font-weight: bold;
  color: black;
  font-size: 3.375rem;

  span {
    font-size: 3.125rem;
  }
`;
