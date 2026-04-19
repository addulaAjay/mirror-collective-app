/**
 * @deprecated Use `<Button variant="auth" />` from `@components/Button` instead.
 * This wrapper will be removed in a future cleanup pass.
 */
import React from 'react';

import Button from './Button';

interface Props {
  onPress: () => void;
  title: string;
}

const AuthButton = ({ onPress, title }: Props) => (
  <Button variant="auth" onPress={onPress} title={title} />
);

export default AuthButton;
