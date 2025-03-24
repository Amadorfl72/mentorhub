declare module 'react-linkify' {
  import * as React from 'react';

  interface LinkifyProps {
    children: React.ReactNode;
    componentDecorator?: (
      decoratedHref: string, 
      decoratedText: string, 
      key: number
    ) => React.ReactNode;
    hrefDecorator?: (href: string) => string;
    matchDecorator?: (text: string) => string;
    textDecorator?: (text: string) => string;
    properties?: Record<string, any>;
  }

  const Linkify: React.ComponentType<LinkifyProps>;
  
  export default Linkify;
} 