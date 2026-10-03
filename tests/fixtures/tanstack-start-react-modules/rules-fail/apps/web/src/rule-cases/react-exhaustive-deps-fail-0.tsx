function MyComponent(props) {
          const value = props.flag ? {} : {};
          useCallback(() => {
            return value;
          }, [value]);
        }