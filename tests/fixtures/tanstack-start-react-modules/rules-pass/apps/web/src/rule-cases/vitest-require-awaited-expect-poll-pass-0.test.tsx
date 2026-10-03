
                    test('should pass', async () => {
                      await expect.poll(() => element).toBeInTheDocument();
                    });
                  