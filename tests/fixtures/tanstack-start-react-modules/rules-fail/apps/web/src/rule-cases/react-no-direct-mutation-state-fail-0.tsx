
                  var Hello = createReactClass({

                    componentWillMount() {
                      this.state.foo = "Chicken, you're so beautiful"
                    },

                          render: function() {
                            this.state.foo = "Chicken, you're so beautiful"
                            return <div>Hello{this.props.name} <Hello2/></div>;
                          }
                        });

                  var Hello2 = createReactClass({
                          render: () => {
                             this.state.foo = "Chicken, you're so beautiful"
                            return <div>Hello {this.props.name}</div>;
                          }
                        });
          