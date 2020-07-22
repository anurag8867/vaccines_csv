# Vaccines
        # Server Envioronment : NodeJs
        # Language : JavaScript
            * All the functions are accomadated with meaning full names which defines the functionality of the function
              If anywhere I felt that naming convention may not define the true meaning of the operation, then I have provided thone liner comment there.
    # Api's exposed:

            API to get the list of vaccines under development with the following filters. When used without filters, the API should return the entire list paginated. 
            * GET
                    * Search : 
                        API to get the list of vaccines under development with the following filters. When used without filters, the API should return the entire list paginated. 
                        Search by vaccine type (product category in the csv file)
                        The developer  / researcher of the vaccine
                        Stage of development

                    ```curl --location --request GET 'http://localhost:3008/search?productCategory=DNA-based
                    &developer=abc&stageOfDevelopment=abc' \
                        --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImVtYWlsIjoiZW1haWwxMTExMXExIiwiaWQiOjF9LCJpYXQiOjE1OTQ4MzYxNzgsImV4cCI6MTU5NTE5NjE3OH0.v5g7BaZpyT7hUyhyV3O7aD_vbBdBHiN6wvpNCvmjoms'```

            API to upload a new CSV file which would update the content of the vaccine development status in the backend.
            * PUT
                    * update stage of development of a medicine : 
                        API to upload a new CSV file which would update the content of the vaccine development status in the backend and change last updated status as well.
                        
                    ```curl --location --request PUT 'http://localhost:3008/update' \
                        --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImVtYWlsIjoiZW1haWwxMTExMXExIiwiaWQiOjF9LCJpYXQiOjE1OTQ4MzYxNzgsImV4cCI6MTU5NTE5NjE3OH0.v5g7BaZpyT7hUyhyV3O7aD_vbBdBHiN6wvpNCvmjoms' \
                        --form 'sheet=@/home/springrole/Downloads/UpdateCOVID-19 Tracker-Vaccines - COVID-19 Tracker-Vaccines.csv'```

