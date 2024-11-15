<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP array stuff</title>
</head>
<body>
    <?php
        $type = 'HTML';
        $version = 7.3;

        // PHP arrays are index as 0, 1, 2, ...
        // Java equivalent:
        //     String[] names = { "John", "Mary", "Fred" };
        //     String[] pets = new String[3];
        $names = array( "John", "Mary", "Fred", "Wilma" );
        array_push($names, "Bill");                         // add Bill after array is created
        array_push($names, "Betty");
        echo "<h1>Indexed Arrays</h1>\n";
        echo "<p>hard coded array index</p>\n";
        echo "<ul>";
        echo "<li>$names[0]</li>\n";
        echo "<li>$names[1]</li>\n";
        echo "<li>$names[2]</li>\n";
        echo "<li>$names[3]</li>\n";
        echo "<li>$names[4]</li>\n";
        echo "</ul>";
        /* Betty doesn't appear because Betty is names[5], which I didn't include */

        echo "<p>for loop counting index</p>\n";
        echo "<ul>\n";
        for ($index = 0; $index < count($names); $index++) {
            echo "<li>$names[$index]</li>\n";
        }
        echo "</ul>\n";

        echo "<p>foreach loop of array elements</p>\n";
        echo "<ul>\n";
        foreach ($names as $individual_name) {
            echo "<li>$individual_name</li>\n";         // $individual name changes each time
        }
        echo "</ul>\n";

        //Associative Arrays use ANYTHING as the "index" (key)
        echo "<h1>Associative Arrays</h1>\n";

        //                      key                  value
        $employees = array ( "John Smith"        => "Sales" ,
                             "Mary Jones"        => "IT",
                             "Fred Flintstone"   => "Sales",
                             "Wilma Flintstone"  => "HR"
                            );

        echo "<p>Before: John Smith's department is " . $employees['John Smith']. ".</p>";
        $employees['John Smith'] = "Executive";             // editing value already there
        echo "<p>After: John Smith's department is " . $employees['John Smith'] . ".</p>";
        
        $employees['Michael Lord'] = "Executive";           // adding key and value

        // pull out a key-value pair each time through the loop
        echo "<p>foreach on assicaitive array</p>";
        echo "<ul>\n";
        foreach ($employees as $key => $value) {
            echo "<li><u>$key</u> is in the <u>$value</u> department.</li>\n";
        }
        echo "</ul>\n";
        

        //make a table with the key value pairs
        echo "<table border='1'>\n";
        echo "<tr><th>Name</th><th>Department</th></tr>\n";
        foreach ($employees as $emp_name => $emp_dept) {
            echo "<tr><td>$emp_name</td><td>$emp_dept</td></tr>\n";
        }
        echo "</table>\n";



    ?>

</body>
</html>