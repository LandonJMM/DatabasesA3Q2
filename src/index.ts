import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm'
import { studentTable } from './db/schema';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const db = drizzle(process.env.DATABASE_URL!);
const prompt = createInterface({input: stdin, output: stdout}); // used to ask questions to the user

// used for adding the 3 base entries to the db
async function setup() {
    const students: typeof studentTable.$inferInsert[] = [
        {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            enrollment_date: '2023-09-01'
        },
        {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            enrollment_date: '2023-09-01'
        },
        {
            first_name: 'Jim',
            last_name: 'Beam',
            email: 'jim.beam@example.com',
            enrollment_date: '2023-09-02'
        },
    ];
    
    try {
        // add the student list to the db
        const insertedStudents = await db.insert(studentTable).values(students);
        console.log('Inserted', insertedStudents.rowCount, 'students.');
    } catch (error) {
        console.log("Failed to insert into students. Error: ", error);
    }
}

// used to remove all entries from the student table in the db
// does not reset the generated identity values
async function teardown() {
    try{
        await db.delete(studentTable);
        console.log("StudentTable cleared.");
    } catch (error) {
        console.log("Failed to reset students. Error: ", error);
    }
}

// used as an intermediary step to allow getAllStudents() to be of a more base form
async function printAllStudents() {
    console.log(await getAllStudents());
}

// returns an object containing all the students in the student table
async function getAllStudents(){
    try {
        return await db.select().from(studentTable);
    } catch (error) {
        console.log("Failed to get all students. Error: ", error);
    }
}

// used as an intermediary step to get info from the user while removing complexity from the main loop
async function getAddInfo() {
    console.log("\nEnter the student details...")
    await addStudent(
        (await prompt.question('First name: ')).trim(),
        (await prompt.question('Last name: ')).trim(),
        (await prompt.question('Email: ')).trim().toLocaleLowerCase(),
        (await prompt.question('Enrollment date (yyyy-mm-dd): ')).trim()
    );
}

// adds a student to the table with the inputed info
// can't have input be of student type as function perameters are set in the outline
async function addStudent(first_name: string, last_name: string, email: string, enrollment_date: string) {
    try {
        // cast the info to student type
        const student: typeof studentTable.$inferInsert = {
            first_name: first_name,
            last_name: last_name,
            email: email,
            enrollment_date: enrollment_date
        };
        
        const insertedStudents = await db.insert(studentTable).values(student);
        console.log("Inserted ", insertedStudents.rowCount, " students."); 
    } catch (error) {
        console.log("Failed to add student. Error: ", error);
    }
}

// used as an intermediary step to get info from the user while removing complexity from the main loop
async function getUpdatedEmail() {
    console.log("\nEnter the student details...")
    await updateStudentEmail(
        (await prompt.question('Student ID: ')).trim(),
        (await prompt.question('Updated Email: ')).trim(),
    );
}

// updates the student with the specified ID with the inputed email
async function updateStudentEmail(student_id: string, email: string) {
    try {
        const updatedStudents = await db
            .update(studentTable)
            .set({email: email})
            .where(eq(studentTable.student_id, Number(student_id)));
        
        console.log("Updated ", updatedStudents.rowCount, " student email.");
    } catch (error) {
        console.log("Failed to update student email. Error: ", error);
    }
}

// used as an intermediary step to get info from the user while removing complexity from the main loop
async function getDeleteID() {
    await deleteStudent(
        (await prompt.question('\nEnter the ID of the student to delete: ')).trim()
    )
}

// deletes the student from the table with the specified ID
async function deleteStudent(student_id: string) {
    try {
        const deletedStudents = await db
            .delete(studentTable)
            .where(eq(studentTable.student_id, Number(student_id)));
        console.log("Deleted ", deletedStudents.rowCount, " student.");
    } catch (error) {
        console.log("Failed to delete student. Error: ", error);
    }
}

// function runs apon boot
async function main() {
    try {
        // loops untile the user commands an exit
        while (true) {
            const option = (await prompt.question('\nEnter Command (or \'exit\'): ')).trim().toLocaleLowerCase();

            //option for the user to exit the loop and quit the program safely
            if (option === 'exit') {
                break;
            }
            
            // check which command the user inputed
            switch (option){
                case 'setup':
                    await setup();
                    break;
                case 'teardown':
                    await teardown();
                    break;
                case 'get':
                    await printAllStudents();
                    break;
                case 'add':
                    await getAddInfo();
                    break;
                case 'update':
                    await getUpdatedEmail();
                    break;
                case 'delete':
                    await getDeleteID();
                    break;
                default:
                    console.log("Unknown command. Valid commands are 'setup', 'teardown', 'get', 'add', 'update', 'delete, and 'exit' to quit.");
            }
        }
    } finally {
        prompt.close();
        await db.$client.end();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});