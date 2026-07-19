# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: community-tabs.spec.mjs >> Community Page Tabs >> reviews tab loads without errors
- Location: tests\community-tabs.spec.mjs:32:3

# Error details

```
Error: page.evaluate: ReferenceError: CommunityManager is not defined
    at eval (eval at evaluate (:303:30), <anonymous>:1:24)
    at UtilityScript.evaluate (<anonymous>:305:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Back to landing" [ref=e5] [cursor=pointer]:
        - /url: /index.html?next=index.html
        - img "Zo2y home" [ref=e6]
      - link "sign up" [ref=e7] [cursor=pointer]:
        - /url: sign-up.html
    - generic [ref=e8]:
      - heading "Log in" [level=2] [ref=e9]
      - button "Sign in with Google" [ref=e10] [cursor=pointer]:
        - img [ref=e11]
        - text: Sign in with Google
      - generic [ref=e17]: or continue with email
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: 
          - textbox "Email" [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: 
          - textbox "Password" [ref=e24]
        - generic [ref=e25]:
          - generic [ref=e26]:
            - checkbox "Remember me" [ref=e27]
            - text: Remember me
          - link "Forgot password?" [ref=e28] [cursor=pointer]:
            - /url: "#"
        - button " Log In" [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: 
          - text: Log In
      - generic [ref=e31]:
        - text: Don't have an account?
        - link "Sign up" [ref=e32] [cursor=pointer]:
          - /url: /sign-up.html?next=community
  - dialog "Cookie consent" [ref=e33]:
    - generic [ref=e34]:
      - generic [ref=e35]: 
      - text: Cookies on Zo2y
    - paragraph [ref=e36]:
      - text: We use strictly necessary cookies to keep you signed in and secure. With your consent we also use functional and analytics cookies. We don't use advertising trackers.
      - link "Learn more" [ref=e37] [cursor=pointer]:
        - /url: cookies.html
      - text: ·
      - link "Privacy" [ref=e38] [cursor=pointer]:
        - /url: privacy.html
    - generic [ref=e39]:
      - button "Accept all" [ref=e40] [cursor=pointer]
      - button "Customize" [ref=e41] [cursor=pointer]
```